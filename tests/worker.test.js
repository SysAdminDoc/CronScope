import assert from "node:assert/strict";
import { test } from "node:test";
import { generateFireTimeBatch } from "../fire-time-worker.js";

test("worker batch generation serializes parser fire times", () => {
  const results = generateFireTimeBatch([
    { id: "weekday", expression: "0 9 * * MON-FRI", dialect: "unix", fieldMode: "auto" },
    { id: "invalid", expression: "not a cron", dialect: "unix", fieldMode: "auto" },
  ], 2026, 3);
  assert.equal(results[0].id, "weekday");
  assert.equal(results[0].valid, true);
  assert.equal(results[0].times.length, 3);
  assert.equal(new Date(results[0].times[0]).getHours(), 9);
  assert.equal(results[1].valid, false);
  assert.deepEqual(results[1].times, []);
});
