import React, { useEffect, useState } from "react";
import { BatteryCharging, Cpu, Plug, ShieldCheck } from "lucide-react";

const labels = {
  charging: "Charging",
  discharging: "On battery",
  "plugged-in": "Plugged in · not charging",
  idle: "Battery idle",
  mixed: "Mixed battery states",
  unavailable: "Unavailable",
};
const power = (value) =>
  Number.isFinite(value) ? `${value.toFixed(1)} W` : "Unavailable";

export default function HardwarePanel({ hardware, isDesktop }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (!isDesktop)
    return (
      <section className="panel hardware-intro">
        <Cpu size={28} />
        <h2>Windows desktop app required</h2>
        <p>
          Browsers cannot inspect your laptop’s battery charging rate or running
          apps. Open the installed Wattwise desktop app, then choose Live
          hardware.
        </p>
        <p>
          No PowerShell commands or driver installation needed. Hardware support
          still determines which readings are available.
        </p>
      </section>
    );
  const fresh =
    hardware?.status === "ready" &&
    Number.isFinite(hardware.updatedAt) &&
    now - hardware.updatedAt < 15000;
  const battery = fresh ? hardware.battery : null;
  const apps =
    fresh && now - hardware.appsUpdatedAt < 15000 ? hardware.apps : null;
  const measured = (value) =>
    Number.isFinite(value)
      ? "Sensor reported · battery side"
      : "Not reported by this sensor";
  return (
    <div className="hardware-page">
      <section className="panel hardware-intro">
        <div className="hardware-title">
          <Cpu size={24} />
          <div>
            <h2>Automatic hardware check</h2>
            <p>{hardware?.device?.processor || "Checking processor…"}</p>
          </div>
          <span className={`pill ${fresh ? "green" : "purple"}`}>
            {fresh ? "Live Windows telemetry" : "No live reading"}
          </span>
        </div>
        <p>
          Charging and app activity, without terminal commands. Battery sensors
          refresh approximately every second; app CPU activity refreshes about
          every 5 seconds.
        </p>
        {!fresh && (
          <p role="status">
            {hardware?.status === "ready"
              ? "Readings are stale. Waiting for fresh Windows telemetry…"
              : hardware?.message || "Automatically checking Windows sensors…"}
          </p>
        )}
      </section>
      <div className="hardware-cards">
        <section className="panel hardware-card" aria-label="Battery status">
          <BatteryCharging size={21} />
          <h3>Battery status</h3>
          <strong>
            {battery ? labels[battery.status] || "Unavailable" : "Unavailable"}
          </strong>
          <p>
            {battery?.message ||
              "Waiting for a supported Windows battery sensor."}
          </p>
        </section>
        <section
          className="panel hardware-card"
          aria-label="Battery charging power"
        >
          <BatteryCharging size={21} />
          <h3>Into the battery</h3>
          <strong>{power(battery?.chargeWatts)}</strong>
          <span>{measured(battery?.chargeWatts)}</span>
          <p>
            Charging power only. Not the laptop’s total draw and not socket
            electricity.
          </p>
        </section>
        <section
          className="panel hardware-card"
          aria-label="Battery discharge power"
        >
          <BatteryCharging size={21} />
          <h3>Out of the battery</h3>
          <strong>{power(battery?.dischargeWatts)}</strong>
          <span>{measured(battery?.dischargeWatts)}</span>
          <p>Battery discharge power. Does not include charger losses.</p>
        </section>
        <section className="panel hardware-card" aria-label="Socket power">
          <Plug size={21} />
          <h3>From the socket</h3>
          <strong>Not measured</strong>
          <span>External meter required</span>
          <p>
            No wall-power integration is connected in this version. Charger
            capacity is not actual consumption.
          </p>
        </section>
      </div>
      <section className="panel hardware-apps">
        <div className="hardware-title">
          <Cpu size={23} />
          <div>
            <h2>App CPU activity</h2>
            <p>Which apps are keeping your processor busy?</p>
          </div>
          <span className="pill purple">CPU %, not watts</span>
        </div>
        <p>
          {apps?.message ||
            "Waiting for a fresh app activity interval. Protected processes may be unavailable."}
        </p>
        {apps?.status === "ready" && apps.rows.length > 0 ? (
          <div className="hardware-table-wrap">
            <table>
              <caption className="sr-only">
                Top apps by CPU activity, normalized across all logical
                processors
              </caption>
              <thead>
                <tr>
                  <th scope="col">Process name</th>
                  <th scope="col">Processes</th>
                  <th scope="col">CPU activity</th>
                  <th scope="col">App power</th>
                </tr>
              </thead>
              <tbody>
                {apps.rows.map((row) => (
                  <tr key={row.name}>
                    <th scope="row">{row.name}</th>
                    <td>{row.processes}</td>
                    <td>
                      <div className="hardware-cpu">
                        <span>{row.cpuPercent.toFixed(1)}%</span>
                        <progress
                          value={row.cpuPercent}
                          max="100"
                          aria-label={`${row.name} CPU activity`}
                        />
                      </div>
                    </td>
                    <td>Not measured</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="hardware-empty" role="status">
            {apps?.status === "unavailable"
              ? "Windows did not provide a usable app activity interval."
              : "Collecting app activity…"}
          </div>
        )}
        <p className="hardware-disclaimer">
          CPU activity is not electricity consumption. This version does not
          measure per-app watts, GPU watts, or per-app energy/cost. Screen, GPU,
          fans, charging and conversion losses cannot be allocated using CPU
          percentages.
        </p>
      </section>
      <section className="panel hardware-intro hardware-privacy">
        <ShieldCheck size={21} />
        <div>
          <h3>Read-only. Local. No custom driver.</h3>
          <p>
            Runs while Wattwise is open, including in the tray. Pause tracking
            pauses energy totals, not this live diagnostic view. Sleep or Quit
            stops monitoring. Process names stay in memory: no app-activity
            history is saved or uploaded. Charging readings are not added to
            discharge energy totals or CSV reports.
          </p>
        </div>
      </section>
    </div>
  );
}
