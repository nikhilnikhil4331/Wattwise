import { test } from "node:test";
import assert from "node:assert/strict";
import { batteryTelemetry, ProcessActivity } from "../desktop/hardware.js";
import {
  parseBatterySample,
  startWindowsSensor,
} from "../desktop/windows-sensor.js";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";

const charging = {
  PowerOnline: true,
  Charging: true,
  Discharging: false,
  ChargeRate: 23500,
  DischargeRate: 0,
};
const read = (b) => batteryTelemetry({ batteries: [b] });
const proc = (pid, cpuSeconds, name = "Browser", started = "start-1") => ({
  pid,
  cpuSeconds,
  name,
  started,
});
const sample = (tickMs, items, cores = 12) => ({ tickMs, items, cores });

test("charging milliwatts become battery watts, never discharge or wall energy", () => {
  const input = { batteries: [charging] };
  assert.equal(batteryTelemetry(input).chargeWatts, 23.5);
  assert.equal(batteryTelemetry(input).dischargeWatts, null);
  assert.equal(batteryTelemetry(input).status, "charging");
  assert.equal(parseBatterySample(input).available, false);
  assert.equal(
    batteryTelemetry({ batteries: [charging, charging] }).chargeWatts,
    47,
  );
});

test("zero, missing, negative and sentinel charging rates remain unavailable", () => {
  for (const ChargeRate of [
    0,
    undefined,
    null,
    -1,
    4294967295,
    10000000,
    Infinity,
    NaN,
    "23500",
  ]) {
    const value = read({ ...charging, ChargeRate });
    assert.equal(value.status, "charging");
    assert.equal(value.chargeWatts, null);
  }
});

test("full or charge-limited battery does not invent a charging value", () => {
  const value = read({ ...charging, Charging: false });
  assert.equal(value.status, "plugged-in");
  assert.equal(value.chargeWatts, null);
  assert.equal(value.dischargeWatts, null);
});

test("discharging, mixed packs and unsupported sensors are distinct", () => {
  const discharging = {
    ...charging,
    PowerOnline: false,
    Charging: false,
    Discharging: true,
    DischargeRate: 15000,
  };
  assert.equal(read(discharging).dischargeWatts, 15);
  assert.equal(read(discharging).chargeWatts, null);
  assert.equal(
    batteryTelemetry({ batteries: [charging, discharging] }).status,
    "mixed",
  );
  for (const input of [
    null,
    {},
    { error: true },
    { batteries: [] },
    { batteries: [null] },
    { batteries: [{}] },
    { batteries: [{ ...charging, Discharging: true }] },
  ]) {
    assert.equal(batteryTelemetry(input).status, "unavailable");
  }
});

test("CPU delta is normalized across 12 threads and grouped by process name", () => {
  const activity = new ProcessActivity();
  assert.equal(
    activity.accept(sample(0, [proc(1, 10), proc(2, 0)])).status,
    "warming-up",
  );
  const value = activity.accept(sample(5000, [proc(1, 15), proc(2, 5)]));
  assert.equal(value.status, "ready");
  assert.equal(value.rows.length, 1);
  assert.equal(value.rows[0].processes, 2);
  assert.ok(Math.abs(value.rows[0].cpuPercent - 100 / 6) < 1e-10);
  assert.equal("watts" in value.rows[0], false);
});

test("PID reuse, exited processes and backwards CPU counters cannot invent activity", () => {
  const activity = new ProcessActivity();
  activity.accept(sample(0, [proc(1, 100), proc(2, 100), proc(3, 10)]));
  const value = activity.accept(
    sample(5000, [
      proc(1, 500, "Browser", "new-start"),
      proc(3, 5),
      proc(4, 10),
    ]),
  );
  assert.equal(value.rows.length, 0);
});

test("sleep, restart, backwards timestamps and topology changes reset CPU baseline", () => {
  for (const [tick, cores] of [
    [16000, 12],
    [0, 12],
    [5000, 8],
  ]) {
    const activity = new ProcessActivity();
    activity.accept(sample(100, [proc(1, 0)]));
    assert.equal(
      activity.accept(sample(tick, [proc(1, 4)], cores)).status,
      "warming-up",
    );
  }
});

test("malformed/restricted app readings clear old rows, then require a new interval", () => {
  const activity = new ProcessActivity();
  activity.accept(sample(0, [proc(1, 0)]));
  assert.equal(activity.accept(sample(5000, [proc(1, 1)])).status, "ready");
  for (const input of [
    null,
    { error: true },
    sample(10, [], 0),
    sample(NaN, []),
    sample(10, Array(5001).fill({})),
  ]) {
    assert.equal(activity.accept(input).status, "unavailable");
    assert.equal(activity.value.rows.length, 0);
  }
  assert.equal(
    activity.accept(sample(10000, [proc(1, 2)])).status,
    "warming-up",
  );
});

test("invalid process fields are filtered, output is bounded and has no identifiers", () => {
  const activity = new ProcessActivity();
  const items = Array.from({ length: 30 }, (_, i) =>
    proc(i + 1, 0, `App ${i}`),
  );
  activity.accept(sample(0, items));
  const value = activity.accept(
    sample(5000, [
      ...items.map((p) => ({ ...p, cpuSeconds: p.pid / 100 })),
      null,
      proc(-1, 2),
      proc(500, NaN),
    ]),
  );
  assert.equal(value.rows.length, 15);
  assert.ok(value.rows[0].cpuPercent > value.rows[14].cpuPercent);
  assert.deepEqual(Object.keys(value.rows[0]).sort(), [
    "cpuPercent",
    "name",
    "processes",
  ]);
});

test("one reader delivers app telemetry even when battery query is unsupported", () => {
  const child = new EventEmitter();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.kill = () => child.emit("close");
  const hardware = [],
    battery = [];
  const stop = startWindowsSensor((value) => battery.push(value), {
    platform: "win32",
    spawnProcess: () => child,
    onHardware: (value) => hardware.push(value),
  });
  try {
    child.stdout.write(
      JSON.stringify({ error: true, processes: sample(0, [proc(1, 0)]) }) +
        "\n",
    );
    child.stdout.write(
      JSON.stringify({ error: true, processes: sample(5000, [proc(1, 5)]) }) +
        "\n",
    );
    assert.equal(hardware.at(-1).apps.status, "ready");
    assert.equal(hardware.at(-1).battery.status, "unavailable");
    assert.equal(battery.at(-1).available, false);
    child.stdout.write("invalid json\n");
    assert.equal(hardware.at(-1).status, "unavailable");
    assert.equal(hardware.at(-1).apps, null);
  } finally {
    stop();
  }
  const count = hardware.length;
  child.stdout.write(JSON.stringify({ batteries: [charging] }) + "\n");
  assert.equal(hardware.length, count);
});

test("non-Windows diagnostics explicitly report unavailable", () => {
  const hardware = [];
  const stop = startWindowsSensor(() => {}, {
    platform: "linux",
    onHardware: (h) => hardware.push(h),
    spawnProcess: () => {
      throw new Error("Must not spawn");
    },
  });
  assert.equal(hardware[0].status, "unavailable");
  stop();
});
