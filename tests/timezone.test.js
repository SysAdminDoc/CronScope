import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const start = source.indexOf("function getTZFormatter");
const end = source.indexOf("// Estimate total fire count", start);
assert.ok(start >= 0 && end > start, "timezone helpers should be present");
const timezoneHelpers = new Function(
  "const TZ_FORMATTERS = new Map(); const ZONED_INSTANT_CACHE = new Map(); const DEBIAN_CATCHUP_CACHE = new Map(); const LOCAL_TIMEZONE = 'Etc/UTC';\n" +
  source.slice(start, end) +
  "\nreturn { findZonedInstants, makeFireDates };"
)();

test("timezone resolver represents DST skips and duplicates", () => {
  const skipped = timezoneHelpers.findZonedInstants(2026, 2, 8, 2, 30, 0, "America/New_York");
  assert.deepEqual(skipped, []);

  const repeated = timezoneHelpers.findZonedInstants(2026, 10, 1, 1, 30, 0, "America/New_York");
  assert.equal(repeated.length, 2);

  const dstAware = timezoneHelpers.makeFireDates({ timezone:"America/New_York", dstAware:true }, 2026, 10, 1, 1, 30, 0);
  assert.equal(dstAware.length, 2);
  assert.equal(dstAware[1].__cronDisplay.duplicated, true);

  const wallClock = timezoneHelpers.makeFireDates({ timezone:"America/New_York", dstAware:false }, 2026, 10, 1, 1, 30, 0);
  assert.equal(wallClock.length, 1);
  assert.equal(wallClock[0].getTime(), repeated[0]);
});

test("Debian DST mode catches up fixed skipped times and suppresses repeats", () => {
  const skipped = timezoneHelpers.makeFireDates({ timezone:"America/New_York", dstMode:"debian", minutes:new Set([30]), hours:new Set([2]), seconds:new Set([0]) }, 2026, 2, 8, 2, 30, 0);
  assert.equal(skipped.length, 1);
  assert.equal(skipped[0].__cronDisplay.hour, 2);
  assert.equal(skipped[0].__cronDisplay.minute, 30);
  assert.equal(new Intl.DateTimeFormat("en-US", { timeZone:"America/New_York", hour:"numeric", minute:"numeric", hour12:false }).format(skipped[0]), "03:00");

  const repeated = timezoneHelpers.makeFireDates({ timezone:"America/New_York", dstMode:"debian", minutes:new Set([30]), hours:new Set([1]), seconds:new Set([0]) }, 2026, 10, 1, 1, 30, 0);
  assert.equal(repeated.length, 1);
});

test("Debian DST mode leaves wildcard jobs on actual clock instants", () => {
  const skipped = timezoneHelpers.makeFireDates({ timezone:"America/New_York", dstMode:"debian", minutes:new Set([0, 30]), hours:new Set([2]), seconds:new Set([0]) }, 2026, 2, 8, 2, 30, 0);
  assert.deepEqual(skipped, []);

  const repeated = timezoneHelpers.makeFireDates({ timezone:"America/New_York", dstMode:"debian", minutes:new Set([0, 30]), hours:new Set([1]), seconds:new Set([0]) }, 2026, 10, 1, 1, 30, 0);
  assert.equal(repeated.length, 2);
});
