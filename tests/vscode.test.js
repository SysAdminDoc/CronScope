import assert from "node:assert/strict";
import { test } from "node:test";
import { findCronCandidates } from "../vscode-extension/candidates.js";

test("VS Code hover candidate extraction ignores command arguments", () => {
  const line = "cron: 0 9 * * 1-5 /usr/local/bin/report --daily";
  const candidates = findCronCandidates(line);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].expression, "0 9 * * 1-5");
  assert.equal(candidates[0].start, line.indexOf("0 9"));
  assert.equal(candidates[0].parsed.hasSeconds, false);
});

test("VS Code hover candidate extraction supports seconds mode", () => {
  const candidates = findCronCandidates("30 0 9 * * MON-FRI");
  assert.equal(candidates[0].parsed.hasSeconds, true);
  assert.equal(candidates[0].expression, "30 0 9 * * MON-FRI");
});
