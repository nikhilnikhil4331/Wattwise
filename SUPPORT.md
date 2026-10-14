# Getting help

## First checks

1. Use the newest [Windows preview](https://github.com/nikhilnikhil4331/Wattwise/releases). Quit the old tray instance before upgrading.
2. Open **Live hardware** and wait about 5–15 seconds for readings.
3. Distinguish the reading you need: battery charge/discharge, CPU activity, a wattage estimate, or actual wall electricity.
4. Check [Windows behavior and limitations](docs/WINDOWS-DESKTOP.md) before changing settings or drivers.

## Common questions

### “Plugged in / not discharging” or “No signal”

The energy-history sensor tracks battery **discharge**, not socket power. While plugged in, it may wait for discharge. Open **Live hardware** for charging diagnostics; Windows must expose a valid charge rate. Full batteries, charge limits, unsupported drivers and restricted PowerShell can all affect availability.

Do not unplug repeatedly or bypass Windows policies to force readings. To estimate usage while plugged in, explicitly choose **Wattage estimate**; a charger rating is not actual consumption.

### “Which app uses the most electricity?”

The app-activity table shows CPU usage, not watts or kWh. Protected/new/exited processes may be missing. GPU power and per-app electricity attribution are not implemented.

### “How do I measure socket units?”

Use a suitable energy-monitoring plug or wattmeter. Direct meter integration is not included in this version. Battery charge/discharge readings cannot substitute for wall-input measurements.

### “I closed the window but the app is still running”

Close hides Wattwise to the tray so tracking can continue while the laptop is awake. Use the tray menu's **Quit** to stop it. Sleep and quit time are not backfilled.

### “Where is my data?”

The desktop app stores energy state in `%APPDATA%\Wattwise\state.json`. Browser data is separate. Export CSV for a portable report. Do not attach your entire state file to a public issue; it can contain personal device names and usage history.

### “The installer is blocked”

The preview is unsigned. Verify the release and checksum, and contact your administrator if policy blocks it. Do not turn off security or bypass an organization's restrictions.

## Open a useful issue

Use the [issue forms](https://github.com/nikhilnikhil4331/Wattwise/issues/new/choose). Include:

- Wattwise version and installed/source/browser edition.
- Windows version and laptop model (not the serial number).
- Charging / battery / full / charge-limit state, and tracking mode.
- Exact error text, reproduction steps, expected result and a redacted screenshot.

**Never include** passwords, tokens, usernames, computer names, serial numbers, unredacted system reports or private files. Security-sensitive issues follow [Security](SECURITY.md).

Support is community/maintainer best effort; no response time is guaranteed.
