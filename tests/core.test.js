import assert from "node:assert/strict";
import { getFireTimes, matchesDate, parseCron } from "../cronscope-core.js";

const weekday = parseCron("0 9 * * MON-FRI");
assert.ok(weekday);
assert.equal(getFireTimes(weekday, 2026, 1)[0].getHours(), 9);

const seconds = parseCron("30 0 9 * * MON-FRI", { fieldMode:"6" });
assert.ok(seconds);
assert.equal(getFireTimes(seconds, 2026, 1)[0].getSeconds(), 30);

const lastDay = parseCron("0 0 0 L * ?", { dialect:"quartz", fieldMode:"6" });
assert.ok(lastDay);
assert.equal(matchesDate(lastDay, 2026, 2, 28), true);
assert.equal(matchesDate(lastDay, 2026, 2, 27), false);

const nearestWeekday = parseCron("0 0 9 1W * ?", { dialect:"quartz", fieldMode:"6" });
assert.ok(nearestWeekday);
assert.equal(matchesDate(nearestWeekday, 2026, 8, 3), true);

const nthWeekday = parseCron("0 0 9 ? * MON#2 *", { dialect:"quartz", fieldMode:"7" });
assert.ok(nthWeekday);
assert.equal(matchesDate(nthWeekday, 2026, 6, 8), true);
assert.equal(matchesDate(nthWeekday, 2026, 6, 15), false);

const aws = parseCron("cron(0 9 ? * MON *)", { dialect:"aws" });
assert.ok(aws);
assert.equal(matchesDate(aws, 2026, 6, 1), true);

const numericMode = parseCron("30 0 9 * * MON-FRI", { fieldMode:6 });
assert.ok(numericMode);
assert.equal(numericMode.hasSeconds, true);
assert.equal(numericMode.fieldMode, "6");

const awsAlias = parseCron("@daily", { dialect:"aws", fieldMode:"6" });
assert.ok(awsAlias);
assert.equal(awsAlias.hasSeconds, false);
assert.equal(awsAlias.hasYear, true);

assert.equal(parseCron("0 0 0 * * *", { dialect:"quartz", fieldMode:"6" }), null);
assert.ok(parseCron("0 0 0 ? * MON", { dialect:"quartz", fieldMode:"6" }));

const steppedMinute = parseCron("5/2 * * * *");
assert.ok(steppedMinute);
assert.equal(steppedMinute.minutes.has(5), true);
assert.equal(steppedMinute.minutes.has(7), true);
assert.equal(steppedMinute.minutes.has(4), false);

console.log("core parser tests passed");
