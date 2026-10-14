// Documentation captures only. Hardware data below is an explicit UI fixture,
// never a claim about a real device. Run a dev server before this script.
import { chromium } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { DEFAULT_SETTINGS } from "../../src/energy.js";
const baseURL = process.env.WATTWISE_PREVIEW_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH
    ? {
        executablePath: process.env.CHROMIUM_PATH,
        args: [
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--no-zygote",
          "--use-angle=swiftshader",
        ],
      }
    : {},
);
try {
  await mkdir("docs/assets", { recursive: true });
  const social = await browser.newPage({
    viewport: { width: 1280, height: 640 },
    deviceScaleFactor: 1,
  });
  const banner = await readFile("docs/assets/wattwise-banner.svg", "utf8");
  await social.setContent(
    `<html><head><style>html,body{margin:0;width:1280px;height:640px;background:#18152d}body{display:flex;align-items:center}svg{display:block;flex:none}</style></head><body>${banner}</body></html>`,
  );
  await social.screenshot({ path: "docs/assets/social-preview.png" });
  await social.close();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1120 },
    deviceScaleFactor: 1,
  });
  await page.goto(baseURL);
  await page.getByRole("heading", { name: "Energy overview" }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.getByText("You’re exploring demo mode").waitFor();
  // Stop the demo timer for a stable, clearly labeled overview capture.
  await page
    .getByRole("button", { name: "Pause tracking", exact: true })
    .click();
  await page.screenshot({
    path: "docs/assets/overview.png",
    animations: "disabled",
  });
  await page.close();

  const hardwarePage = await browser.newPage({
    viewport: { width: 1440, height: 1460 },
    deviceScaleFactor: 1,
  });
  await hardwarePage.addInitScript((settings) => {
    const now = Date.now();
    const state = {
      version: 1,
      settings,
      history: [],
      running: true,
      sensorError: "",
      sensorName: "",
      storageError: false,
      session: {
        id: "documentation-fixture",
        mode: "sensor",
        start: now,
        points: [],
        kwh: 0,
        seconds: 0,
        peak: 0,
        device: "Documentation fixture",
      },
      desktop: { canAutoStart: true, launchOnLogin: false, platform: "win32" },
      hardware: {
        status: "ready",
        updatedAt: now,
        appsUpdatedAt: now,
        device: { processor: "Illustrative device · 12 logical processors" },
        battery: {
          status: "charging",
          chargeWatts: 23.5,
          dischargeWatts: null,
          message:
            "Illustrative charging reading. Not a physical device measurement.",
        },
        apps: {
          status: "ready",
          message: "Illustrative process activity. CPU % is not watts.",
          rows: [
            { name: "Browser (sample)", cpuPercent: 12.5, processes: 6 },
            { name: "Editor (sample)", cpuPercent: 4.2, processes: 3 },
            { name: "Wattwise (sample)", cpuPercent: 0.8, processes: 2 },
          ],
        },
      },
    };
    window.wattwiseDesktop = {
      getState: async () => structuredClone(state),
      onState: () => () => {},
    };
  }, DEFAULT_SETTINGS);
  await hardwarePage.goto(baseURL);
  await hardwarePage
    .getByRole("button", { name: "Live hardware", exact: true })
    .click();
  await hardwarePage
    .getByRole("heading", { name: "App CPU activity" })
    .waitFor();
  await hardwarePage.evaluate(() => document.fonts.ready);
  await hardwarePage.evaluate(() => {
    const label = document.createElement("div");
    label.textContent =
      "DOCUMENTATION FIXTURE — ILLUSTRATIVE DATA, NOT A REAL DEVICE MEASUREMENT";
    label.style.cssText =
      "padding:14px 20px;background:#fff1cf;color:#674500;font:700 12px Inter,sans-serif;letter-spacing:.5px;border-radius:12px;margin-bottom:20px";
    document.querySelector(".hardware-page").prepend(label);
  });
  await hardwarePage.screenshot({
    path: "docs/assets/live-hardware.png",
    animations: "disabled",
  });
} finally {
  await browser.close();
}
