import { spawn } from "node:child_process";
import path from "node:path";
import { batteryTelemetry, ProcessActivity } from "./hardware.js";

export function parseBatterySample(input) {
  if (!input || input.error)
    return {
      available: false,
      message:
        "Windows battery sensor could not be read. Your driver may not support it.",
    };
  const batteries = Array.isArray(input.batteries) ? input.batteries : [];
  if (!batteries.length)
    return {
      available: false,
      message:
        "No supported Windows battery sensor was found. Use Wattage estimate or an external meter.",
    };
  let watts = 0;
  for (const b of batteries) {
    if (
      b.Discharging !== true ||
      b.PowerOnline === true ||
      b.Charging === true
    ) {
      return {
        available: false,
        message:
          "Battery discharge tracking is waiting. Open Live hardware for charging readings and app CPU activity. Socket electricity needs an external meter.",
      };
    }
    if (
      !Number.isFinite(b.DischargeRate) ||
      b.DischargeRate <= 0 ||
      b.DischargeRate >= 10000000
    ) {
      return {
        available: false,
        message:
          "This battery driver does not supply a valid discharge rate. Use Wattage estimate instead.",
      };
    }
    watts += b.DischargeRate / 1000;
  }
  if (watts > 10000)
    return {
      available: false,
      message: "Battery sensor returned an out-of-range reading.",
    };
  return { available: true, watts, source: "Windows battery discharge (WMI)" };
}

// A single read-only PowerShell process avoids spawning a console every second.
// Never interpolate renderer/user input into this command.
const SENSOR_SCRIPT = `
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$clock = [Diagnostics.Stopwatch]::StartNew()
$nextApps = 0
while ($true) {
  $sample = @{}
  try {
    $sample.batteries = @(Get-CimInstance -Namespace root/wmi -ClassName BatteryStatus | Where-Object { $_.Active } | Select-Object Discharging, DischargeRate, PowerOnline, Charging, ChargeRate)
  } catch { $sample.error = $true }
  if ($clock.Elapsed.TotalMilliseconds -ge $nextApps) {
    try {
      $items = @(Get-Process -ErrorAction Stop | ForEach-Object {
        try {
          $p = $_
          $cpu = $p.CPU
          if ($p.Id -gt 0 -and $null -ne $cpu) {
            @{ pid = $p.Id; name = $p.ProcessName; started = $p.StartTime.ToUniversalTime().Ticks.ToString(); cpuSeconds = [double]$cpu }
          }
        } catch { }
      })
      $sample.processes = @{ items = $items; cores = [Environment]::ProcessorCount; tickMs = $clock.Elapsed.TotalMilliseconds }
    } catch { $sample.processes = @{ error = $true } }
    $nextApps = $clock.Elapsed.TotalMilliseconds + 5000
  }
  [Console]::WriteLine(($sample | ConvertTo-Json -Compress -Depth 5))
  [Console]::Out.Flush()
  Start-Sleep -Milliseconds 1000
}
`;

export function startWindowsSensor(
  onSample,
  {
    platform = process.platform,
    spawnProcess = spawn,
    onHardware = () => {},
  } = {},
) {
  const unavailable = (message) => {
    onHardware({
      status: "unavailable",
      message,
      updatedAt: Date.now(),
      battery: null,
      apps: null,
    });
    onSample({ available: false, message });
  };
  if (platform !== "win32") {
    unavailable(
      "Live hardware requires Windows. Estimate mode works on other operating systems.",
    );
    return () => {};
  }
  let stopped = false,
    child = null,
    retry = null,
    watchdog = null;
  const launch = () => {
    if (stopped) return;
    let buffer = "";
    const activity = new ProcessActivity();
    let appsUpdatedAt = 0;
    const executable = path.win32.join(
      process.env.SystemRoot || "C:\\Windows",
      "System32",
      "WindowsPowerShell",
      "v1.0",
      "powershell.exe",
    );
    const proc = spawnProcess(
      executable,
      [
        "-NoLogo",
        "-NoProfile",
        "-NonInteractive",
        "-EncodedCommand",
        Buffer.from(SENSOR_SCRIPT, "utf16le").toString("base64"),
      ],
      { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
    );
    child = proc;
    const resetWatchdog = () => {
      clearTimeout(watchdog);
      watchdog = setTimeout(() => {
        if (!stopped && child === proc) {
          unavailable(
            "Windows sensor stopped responding. Reconnecting; missing time is not counted.",
          );
          proc.kill();
        }
      }, 15000);
    };
    resetWatchdog();
    proc.stdout.setEncoding("utf8");
    proc.stdout.on("data", (chunk) => {
      if (stopped || child !== proc) return;
      buffer += chunk;
      if (buffer.length > 1048576) {
        buffer = "";
        unavailable("Invalid sensor response. Reconnecting.");
        proc.kill();
        return;
      }
      let index;
      while ((index = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, index).trim();
        buffer = buffer.slice(index + 1);
        if (!line) continue;
        resetWatchdog();
        try {
          const input = JSON.parse(line);
          const updatedAt = Date.now();
          if (input?.processes) {
            activity.accept(input.processes);
            appsUpdatedAt = updatedAt;
          } else if (updatedAt - appsUpdatedAt > 15000) {
            activity.reset();
          }
          onHardware({
            status: "ready",
            updatedAt,
            appsUpdatedAt,
            battery: batteryTelemetry(input),
            apps: activity.value,
          });
          onSample(parseBatterySample(input));
        } catch {
          unavailable("Windows sensor returned an unreadable response.");
        }
      }
    });
    // Drain stderr; WMI failures are reported as structured JSON on stdout.
    proc.stderr.on("data", () => {});
    proc.on("error", () => {
      if (!stopped)
        unavailable(
          "Unable to start the Windows sensor. PowerShell may be restricted on this PC.",
        );
    });
    proc.on("close", () => {
      clearTimeout(watchdog);
      if (stopped || child !== proc) return;
      child = null;
      unavailable("Windows sensor disconnected. Retrying in 3 seconds.");
      retry = setTimeout(launch, 3000);
    });
  };
  launch();
  return () => {
    stopped = true;
    clearTimeout(retry);
    clearTimeout(watchdog);
    child?.kill();
    child = null;
  };
}
