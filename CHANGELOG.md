# Changelog

Wattwise releases are currently **previews**. Release tags include a build/run suffix; the application version alone is not a unique artifact identifier. See [all releases](https://github.com/nikhilnikhil4331/Wattwise/releases).

## Unreleased — Repository presentation

- Branded README, vector banner and clearly labeled UI screenshots.
- Installation, capability/accuracy matrix and architecture overview.
- Contribution, support, security and community guidelines.
- Structured bug reports, feature requests and pull request checklist.
- Documentation-link checks and maintainer setup checklist.

No application behavior or measurement capabilities change with this documentation update.

## 1.1.0 — Live hardware preview

[Release: wattwise-v1.1.0-build.4.1](https://github.com/nikhilnikhil4331/Wattwise/releases/tag/wattwise-v1.1.0-build.4.1)

### Added

- Automatic Windows battery charging/discharging diagnostics, with sensor-reported watts when available.
- Live CPU activity for the top 15 process-name groups, normalized across logical processors.
- Clear unsupported, warming-up and stale telemetry states. Process names remain in memory only.
- Unit and browser coverage for charging and app-activity boundaries, plus a real Windows process-feed smoke test.

### Fixed

- Packaged-app smoke testing now waits for resolved IPC telemetry rather than treating an async predicate Promise as a completed reading.

### Boundaries

- Battery charge watts are not wall-input watts. CPU activity is not per-app power.
- No GPU-power sensor, custom kernel driver, per-app kWh/cost, or external-meter integration.
- Charging diagnostics do not enter discharge-history kWh/cost totals or CSV exports.

## 1.0.0 — Initial standalone Windows preview

[Release: wattwise-v1.0.0-build.1.1](https://github.com/nikhilnikhil4331/Wattwise/releases/tag/wattwise-v1.0.0-build.1.1)

- Imported the merged Wattwise project from [NKL PR #1](https://github.com/nikhilnikhil4331/NKL/pull/1).
- React dashboard, battery discharge tracking, explicit wattage estimates, tariffs, history and CSV reports.
- Electron desktop app with tray tracking, optional login startup and local persistence.
- Windows x64 NSIS installer, packaged-app validation and release SHA-256 checksum.
