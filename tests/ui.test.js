import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("../index.html", import.meta.url), "utf8");

function extractFunction(name, nextName) {
  const start = source.indexOf("function " + name);
  assert.notEqual(start, -1, name + " should exist");
  const end = source.indexOf(nextName, start);
  assert.notEqual(end, -1, nextName + " should follow " + name);
  return source.slice(start, end);
}

const parseYamlScalar = extractFunction("parseYamlScalar", "function parseKubernetesCronJobs");
const parseKubernetesCronJobs = extractFunction("parseKubernetesCronJobs", "function parseImportText");
const parseYaml = new Function(parseYamlScalar + "\n" + parseKubernetesCronJobs + "\nreturn parseKubernetesCronJobs;")();

test("Kubernetes import preserves quoted Quartz syntax and metadata names", () => {
  const text = [
    "apiVersion: batch/v1",
    "kind: CronJob",
    "metadata:",
    "  name: nightly-report",
    "spec:",
    "  schedule: \"0 0 ? * MON#2\"",
    "---",
    "apiVersion: batch/v1",
    "kind: CronJob",
    "metadata:",
    "  name: hourly-report # display name",
    "spec:",
    "  schedule: 0 * * * * # every hour",
  ].join("\n");
  assert.deepEqual(parseYaml(text), [
    { value: "0 0 ? * MON#2", label: "nightly-report" },
    { value: "0 * * * *", label: "hourly-report" },
  ]);
});

test("heatmap interaction and export accessibility hooks are present", () => {
  assert.match(source, /ArrowLeft/);
  assert.match(source, /data-heat-cell/);
  assert.match(source, /aria-modal/);
  assert.match(source, /Legend/);
});
