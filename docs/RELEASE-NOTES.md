# Wattwise 1.1.0 — Automatic live hardware preview

## Download and install

1. Download **Wattwise-Setup-1.1.0-x64.exe** from this release's Assets.
2. Open the installer, choose your folder and finish setup.
3. Launch Wattwise from the desktop/Start menu. **Node.js and Python are not required.**
4. In Settings, choose your currency and enter your actual electricity rate per kWh. ₹8 is an example, not your tariff.
5. Open **Live hardware** with the charger connected. Wait about 5–15 seconds for the automatic check and app CPU activity. Charging watts appear only when your driver exposes a valid charging rate.
6. For battery discharge energy history, select Battery sensor and use the laptop on battery.

The installer is **unsigned**. Windows may show an unknown-publisher/SmartScreen warning, or an organization policy may block it. Verify the release origin and optional SHA-256 checksum; do not disable Windows security or bypass organization policy.

## New in 1.1.0

- Automatic Windows battery charging/discharging status and sensor-reported watts in **Live hardware**. No terminal commands or driver installation.
- Top 15 process-name groups by CPU activity, refreshed approximately every five seconds and normalized across logical processors. Protected/new/exited processes may be omitted.
- Charging sensors and app activity work independently of the selected energy source. Pausing energy tracking does not stop live diagnostics; sleep or Quit does.
- CPU activity is **not per-app electricity**. Exact per-app watts, GPU watts and wall-input watts are **not measured**. No custom driver or external-meter integration is included.
- Unknown/zero charging rates, missing sensors and stale data are labeled unavailable, not fabricated. Charging readings never enter discharge kWh/cost totals or CSV exports. Process names are kept only in memory, not saved or uploaded.
- HP Victus/Ryzen charging sensor support still needs verification on the actual device. A Windows CI runner cannot validate physical charging sensors.

## What it does

- Approximate one-second battery sensor sampling, second/minute/hour views, kWh and tariff-based costs.
- Optional explicitly labeled wattage-estimate mode, currency/rate settings, monthly projections and budgets.
- Closing the window hides to the system tray; tracking continues while the laptop is awake.
- Tray menu: Open, Pause/Resume, Quit. Optional Start with Windows is off by default.
- Readings save locally in `%APPDATA%\Wattwise\state.json`. CSV export is available.

## Important accuracy limits

- **Battery discharge power is NOT wall electricity.** The shown battery-energy cost is a tariff-based equivalent, not your charging bill.
- The discharge-history tracker waits while plugged in. Live hardware can separately display charging watts if supported. Missing samples add no energy; no silent guessed readings.
- Whole-laptop wall consumption requires an external wattmeter or energy-monitoring plug. Direct smart-plug integration is not included.
- Sleep, shutdown, quit time and sensor outages are not backfilled. Browser-preview history is separate.
- Currency changes do not convert exchange rates. Tariff changes recalculate historical costs. Taxes, fixed charges and charger losses are excluded.

This is an **early preview**, not a certified energy meter. The release workflow checks unit tests and smoke-tests the packaged app on a Windows runner (startup, IPC, tray-hide background estimation, pause, persistence). Actual laptop battery-driver accuracy, login startup and the installation wizard still need device testing.

If installation or battery detection fails, report the exact error and laptop model. Do not share credentials or private data files.
