// Exercise the packaged Windows executable, not a mocked browser bridge.
const { _electron: electron, expect } = require("@playwright/test");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");
(async () => {
  if (process.platform !== "win32")
    throw new Error("Packaged-app smoke test requires Windows.");
  const app = await electron.launch({
    executablePath: path.resolve("build/windows/win-unpacked/Wattwise.exe"),
    timeout: 60000,
  });
  let page;
  try {
    page = await app.firstWindow({ timeout: 60000 });
    await page
      .getByRole("heading", { name: "Energy overview" })
      .waitFor({ timeout: 60000 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    // Exercise the actual read-only PowerShell process feed on Windows, not mocks.
    // Hosted runners have no battery: app telemetry must still work independently.
    // waitForFunction treats a Promise as truthy; poll the resolved IPC value
    // from Node instead, so this cannot pass before the first CPU interval.
    await expect
      .poll(
        async () => {
          const state = await page.evaluate(() =>
            window.wattwiseDesktop.getState(),
          );
          return state.hardware?.apps?.status;
        },
        {
          timeout: 45000,
          message: "Windows process telemetry must produce a real CPU interval",
        },
      )
      .toBe("ready");
    const live = await page.evaluate(() => window.wattwiseDesktop.getState());
    assert.ok(live.hardware.apps.rows.length > 0);
    assert.ok(
      live.hardware.apps.rows.every(
        (row) =>
          Number.isFinite(row.cpuPercent) &&
          row.cpuPercent >= 0 &&
          row.cpuPercent <= 100,
      ),
    );
    await page
      .getByRole("button", { name: "Live hardware", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Automatic hardware check" })
      .waitFor();
    await page.getByRole("heading", { name: "App CPU activity" }).waitFor();
    assert.match(
      await page
        .getByRole("region", { name: "Socket power", exact: true })
        .innerText(),
      /Not measured/,
    );
    await page.getByRole("button", { name: "Overview", exact: true }).click();
    const initial = await page.evaluate(() =>
      window.wattwiseDesktop.getState(),
    );
    assert.equal(initial.session.mode, "sensor");
    assert.equal(initial.desktop.platform, "win32");
    await page.evaluate(() =>
      window.wattwiseDesktop.command({
        type: "settings",
        settings: {
          currency: "INR",
          rate: 8,
          watts: 100,
          budget: 500,
          hours: 8,
          device: "Windows CI smoke test",
        },
        mode: "estimate",
        launchOnLogin: false,
      }),
    );
    await expect
      .poll(
        async () => {
          const state = await page.evaluate(() =>
            window.wattwiseDesktop.getState(),
          );
          return state.session.seconds;
        },
        { timeout: 15000 },
      )
      .toBeGreaterThanOrEqual(1);
    const before = await page.evaluate(() => window.wattwiseDesktop.getState());
    // Native Close must hide the window, without stopping the main-process sampler.
    await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].close(),
    );
    assert.equal(
      await app.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0].isVisible(),
      ),
      false,
    );
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const hidden = await page.evaluate(() => window.wattwiseDesktop.getState());
    assert.ok(hidden.session.seconds > before.session.seconds + 1);
    assert.ok(
      Math.abs(hidden.session.kwh - (hidden.session.seconds * 100) / 3600000) <
        1e-10,
    );
    await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].show(),
    );
    await page
      .getByRole("button", { name: "Pause tracking", exact: true })
      .click();
    const paused = await page.evaluate(() => window.wattwiseDesktop.getState());
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const after = await page.evaluate(() => window.wattwiseDesktop.getState());
    assert.equal(after.running, false);
    assert.equal(after.session.kwh, paused.session.kwh);
    const dataFile = await app.evaluate(
      ({ app }) => app.getPath("userData") + "/state.json",
    );
    const persisted = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    assert.equal(persisted.running, false);
    assert.equal("hardware" in persisted, false);
    assert.equal(persisted.session.kwh, after.session.kwh);
    assert.deepEqual(errors, []);
    console.log(
      "PASS: live Windows app CPU telemetry works; no hardware data is persisted. Packaged Windows app launches, uses IPC, tracks while tray-hidden, pauses, and saves state.",
    );
  } catch (error) {
    fs.mkdirSync("test-results", { recursive: true });
    if (page)
      await page
        .screenshot({ path: "test-results/windows-smoke-failure.png" })
        .catch(() => {});
    throw error;
  } finally {
    await app.close();
  }
})().catch((error) => {
  console.error(error);
  if (process.env.GITHUB_ACTIONS === "true") {
    const message = String(error.stack || error)
      .slice(0, 5000)
      .replaceAll("%", "%25")
      .replaceAll("\r", "%0D")
      .replaceAll("\n", "%0A");
    console.error(`::error title=Packaged Windows smoke test::${message}`);
  }
  process.exitCode = 1;
});
