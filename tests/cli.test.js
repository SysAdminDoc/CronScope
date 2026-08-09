import assert from "node:assert/strict";
import { test } from "node:test";
import { buildEmbeddedHtml, createSchedules, parseCrontab, renderJson } from "../cronscope-cli.js";

test("crontab pipeline ignores metadata and preserves command labels", () => {
  const schedules = parseCrontab([
    "# comment",
    "MAILTO=ops@example.com",
    "*/15 * * * * /usr/local/bin/health-check --quiet",
    "@daily /srv/reports/nightly-report",
  ].join("\n"));
  assert.equal(schedules.length, 2);
  assert.equal(schedules[0].label, "health-check");
  assert.equal(schedules[1].expression, "@daily");
  assert.equal(schedules[1].label, "nightly-report");
});

test("system crontab mode skips the username field", () => {
  const schedules = parseCrontab("0 2 * * * root /usr/local/sbin/backup", { system:true });
  assert.equal(schedules.length, 1);
  assert.equal(schedules[0].command, "/usr/local/sbin/backup");
  assert.equal(schedules[0].parsed !== null, true);
});

test("CLI JSON includes pivot neighbors and embedded HTML state is safe", () => {
  const schedules = createSchedules(["0 9 * * 1-5"]);
  const json = renderJson(schedules, 2026, {}, new Date(2026, 5, 5, 9));
  const report = JSON.parse(json);
  assert.equal(report.schedules[0].next, new Date(2026, 5, 8, 9).toISOString());

  const html = buildEmbeddedHtml("<script>const EMBEDDED_APP_STATE = null;</script>", {
    exprs:[{ value:"0 9 * * 1-5 </script>", label:"demo" }],
    year:2026,
  });
  assert.match(html, /const EMBEDDED_APP_STATE = \{"exprs"/);
  assert.doesNotMatch(html, /<\/script>\",/);
});

