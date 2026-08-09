import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const start = source.indexOf("function getTZFormatter");
const end = source.indexOf("// Estimate total fire count", start);
assert.ok(start >= 0 && end > start, "timezone helpers should be present");
const timezoneHelpers = new Function(
  "const TZ_FORMATTERS = new Map(); const ZONED_INSTANT_CACHE = new Map(); const LOCAL_TIMEZONE = 'Etc/UTC';\n" +
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
