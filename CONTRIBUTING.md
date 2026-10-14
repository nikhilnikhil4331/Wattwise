# Contributing to Wattwise

Thanks for helping make energy data easier to understand. Small, well-tested changes are welcome—especially fixes for incorrect readings, clearer unavailable states, accessibility and documentation.

## Before you start

- Read the [accuracy boundaries](README.md#what-wattwise-can--cannot-measure) and [Code of Conduct](CODE_OF_CONDUCT.md).
- Search existing [issues](https://github.com/nikhilnikhil4331/Wattwise/issues). For a substantial feature, discuss the approach before implementing it.
- No project license has been selected yet. Do not assume general reuse or redistribution rights; resolve licensing expectations with the maintainer before a substantial contribution.
- For vulnerabilities, follow [Security](SECURITY.md), not a public bug report containing sensitive details.

## Set up

Use Node.js **22.12+** and npm. Clone your fork, then:

```bash
npm ci
npm run dev
```

For native desktop development on Windows:

```bash
npm run desktop
```

The browser UI uses labeled demo data. Desktop-only features need Electron on Windows; the optional Python agent is not required for the installed app. Keep `package-lock.json` in sync when changing dependencies; CI uses `npm ci`.

## Validate your change

```bash
npm test
npx playwright install chromium
npm run test:e2e
npm run build
python -m unittest discover -s tests -p "test_*.py"
node .github/scripts/check-docs.mjs
```

A desktop change should also pass `npm run package:win` and `node scripts/smoke-windows.cjs` on Windows. The packaged-app smoke test uses the real Windows process feed; charging/discharging fixtures are not proof of physical sensor support.

For hardware changes, report what you actually tested: battery state, device model, Windows version, the source of the reading and whether it was measured or estimated. Never claim wall input from battery telemetry or app watts from CPU share alone.

### Documentation images

Start the dev server and run:

```bash
node .github/scripts/capture-readme.mjs
```

The overview capture uses demo mode. The Live hardware capture uses a clearly labeled fixture. Keep those labels and captions. The capture script requires Playwright Chromium (or `CHROMIUM_PATH`) and defaults to `http://127.0.0.1:5173`; an optional `WATTWISE_PREVIEW_URL` can select another development server.

## Pull request checklist

- Explain the problem, approach and user-visible effect.
- Include tests for normal, missing, stale and malformed readings where relevant.
- Keep sensor, estimate and demo sources distinct. No silent fallback or invented backfill.
- Keep charging diagnostics separate from discharge energy totals and CSV data.
- Do not add elevation, execution-policy bypasses, unsafe renderer APIs or security-disabling instructions.
- Do not collect process command lines, credentials or user-identifying data for diagnostics.
- Document limitations and actual validation. Mark anything not tested on real hardware.
- Update guides/changelog when behavior changes. Keep generated installers, local state and test artifacts out of Git.

## Reviews and releases

Open a focused PR against `main`. Maintainers review changes; review and release timings are not guaranteed. The Windows workflow currently publishes preview installers from the configured working branch only after tests and packaging pass. Do not manually overwrite existing release binaries.
