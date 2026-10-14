# Wattwise ⚡

**Windows 11 installer:** see [Wattwise preview releases](https://github.com/nikhilnikhil4331/Wattwise/releases). Successful Windows builds publish a standalone `.exe` and SHA-256 checksum. The installed app does **not** need Node.js or Python.

**Run from source instead:** install Node.js LTS 22.12+, extract the run package, then
double-click `Run-Wattwise.cmd`. Built-in battery reader, tray background tracking,
local disk history and optional Windows sign-in startup. No Python required.
[Simple Windows instructions](WINDOWS-START-HERE.txt) · [Desktop details & installer build](docs/WINDOWS-DESKTOP.md)

A local-first PC/laptop energy tracker with per-second sampling, minute/hour charts,
units (kWh), electricity costs, configurable currencies, session history and CSV export.

```sh
npm install
npm run dev
```

**[Setup, sensor support, calculations, limitations and tests →](docs/WATTWISE.md)**

Starts in labeled demo mode. Use Settings to enter your estimated wattage and per-unit tariff,
or run the included Windows/Linux battery sensor agent locally. Browser-only tracking needs
the app open; exact whole-device wall power needs an external meter.


## Project publishing

The standalone project repository is [nikhilnikhil4331/Wattwise](https://github.com/nikhilnikhil4331/Wattwise). The Windows workflow publishes preview installers only after the build and packaged-app smoke test pass. Development is on `arena/2bd55f92-wattwise`.

## Source provenance

Imported from the merged [NKL PR #1](https://github.com/nikhilnikhil4331/NKL/pull/1),
commit [`c754004d53353d4831187abd85151d61c55e10c9`](https://github.com/nikhilnikhil4331/NKL/commit/c754004d53353d4831187abd85151d61c55e10c9).
The initial import kept application code unchanged. Subsequent development, including the 1.1 live hardware view, is maintained here.

## Live hardware (1.1)

Open **Live hardware** in the Windows desktop app. It automatically checks battery
charging/discharging telemetry and shows top process-name groups by CPU activity.
No terminal commands, custom kernel driver or admin setup are required. Windows
policy restrictions are respected; unsupported rates stay unavailable.

**Battery charging watts are not socket watts. CPU % is not per-app watts.** This
version does not measure wall input, GPU power or per-app energy/cost. External
meter integration is not included. Live hardware readings do not change energy
history/CSV totals; process names stay in memory only. See the desktop guide.
