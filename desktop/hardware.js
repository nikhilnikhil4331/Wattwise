// Read-only telemetry. Battery power must never be presented as wall power or
// allocated to apps using CPU share: those are different physical quantities.
const validRate = (value) =>
  Number.isFinite(value) && value >= 0 && value < 10000000;

export function batteryTelemetry(input) {
  if (
    !input ||
    input.error ||
    !Array.isArray(input.batteries) ||
    !input.batteries.length
  ) {
    return {
      status: "unavailable",
      chargeWatts: null,
      dischargeWatts: null,
      message:
        "Windows did not expose a supported battery sensor. No driver installation is required to check.",
    };
  }
  const batteries = input.batteries;
  if (
    batteries.some(
      (b) =>
        !b ||
        typeof b.Charging !== "boolean" ||
        typeof b.Discharging !== "boolean" ||
        typeof b.PowerOnline !== "boolean" ||
        (b.Charging && b.Discharging),
    )
  ) {
    return {
      status: "unavailable",
      chargeWatts: null,
      dischargeWatts: null,
      message: "Battery status is incomplete or inconsistent.",
    };
  }
  const charging = batteries.filter((b) => b.Charging);
  const discharging = batteries.filter((b) => b.Discharging);
  // A zero while actively charging is ambiguous (often an unsupported driver).
  // Keep it unavailable instead of claiming that charging consumes no energy.
  const chargeWatts =
    charging.length &&
    charging.every((b) => validRate(b.ChargeRate) && b.ChargeRate > 0)
      ? charging.reduce((sum, b) => sum + b.ChargeRate / 1000, 0)
      : null;
  const dischargeWatts =
    discharging.length &&
    discharging.every((b) => validRate(b.DischargeRate) && b.DischargeRate > 0)
      ? discharging.reduce((sum, b) => sum + b.DischargeRate / 1000, 0)
      : null;
  const status =
    charging.length && discharging.length
      ? "mixed"
      : charging.length
        ? "charging"
        : discharging.length
          ? "discharging"
          : batteries.some((b) => b.PowerOnline)
            ? "plugged-in"
            : "idle";
  return {
    status,
    chargeWatts,
    dischargeWatts,
    message:
      status === "plugged-in"
        ? "Plugged in, not charging. Battery may be full or at its charge limit."
        : status === "charging" && chargeWatts === null
          ? "Charging detected, but the driver does not expose a valid charge rate."
          : "Battery-side readings reported by Windows. Not socket consumption.",
  };
}

export class ProcessActivity {
  constructor() {
    this.reset();
  }
  reset() {
    this.previous = null;
    this.value = {
      status: "warming-up",
      rows: [],
      message:
        "Measuring app CPU activity. The first interval takes about 5 seconds.",
    };
    return this.value;
  }
  accept(input) {
    if (
      input?.error ||
      !Array.isArray(input?.items) ||
      input.items.length > 5000 ||
      !Number.isFinite(input.tickMs) ||
      input.tickMs < 0 ||
      !Number.isInteger(input.cores) ||
      input.cores < 1 ||
      input.cores > 1024
    ) {
      this.reset();
      this.value = {
        status: "unavailable",
        rows: [],
        message: "App activity is unavailable or restricted by Windows.",
      };
      return this.value;
    }
    const current = new Map();
    for (const p of input.items) {
      if (
        !p ||
        !Number.isInteger(p.pid) ||
        p.pid <= 0 ||
        typeof p.started !== "string" ||
        !p.started ||
        typeof p.name !== "string" ||
        !p.name ||
        p.name.length > 256 ||
        !Number.isFinite(p.cpuSeconds) ||
        p.cpuSeconds < 0
      )
        continue;
      // Start identity avoids attributing a recycled PID's CPU time to a new app.
      current.set(`${p.pid}/${p.started}`, p);
    }
    const previous = this.previous;
    this.previous = {
      tickMs: input.tickMs,
      cores: input.cores,
      items: current,
    };
    const seconds = previous ? (input.tickMs - previous.tickMs) / 1000 : 0;
    if (
      !previous ||
      seconds <= 0 ||
      seconds > 15 ||
      previous.cores !== input.cores
    ) {
      this.value = {
        status: "warming-up",
        rows: [],
        message:
          "Collecting a fresh CPU interval; sleep and missing time are not backfilled.",
      };
      return this.value;
    }
    const groups = new Map();
    let matched = 0;
    for (const [key, p] of current) {
      const old = previous.items.get(key);
      if (!old || old.name !== p.name) continue;
      const cpu =
        ((p.cpuSeconds - old.cpuSeconds) / seconds / input.cores) * 100;
      if (!Number.isFinite(cpu) || cpu < 0 || cpu > 100.5) continue;
      matched++;
      const group = groups.get(p.name) || {
        name: p.name,
        cpuPercent: 0,
        processes: 0,
      };
      group.cpuPercent += Math.min(100, cpu);
      group.processes++;
      groups.set(p.name, group);
    }
    const rows = [...groups.values()]
      .map((p) => ({ ...p, cpuPercent: Math.min(100, p.cpuPercent) }))
      .sort(
        (a, b) => b.cpuPercent - a.cpuPercent || a.name.localeCompare(b.name),
      )
      .slice(0, 15);
    this.value = {
      status: matched ? "ready" : "unavailable",
      rows,
      message:
        "Top 15 process-name groups. CPU % is normalized across all logical processors; protected, new and exited processes may be omitted. CPU % is not watts.",
    };
    return this.value;
  }
}
