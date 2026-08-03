#!/usr/bin/env node
import { asciiHeatmap, describeCron, getFireTimes, parseCron } from "../cronscope-core.js";

const args = process.argv.slice(2);
const expression = args.find(arg => !arg.startsWith("--"));
const yearArg = args.find(arg => arg.startsWith("--year="));
const dialectArg = args.find(arg => arg.startsWith("--dialect="));
const modeArg = args.find(arg => arg.startsWith("--mode="));
const year = yearArg ? Number(yearArg.slice("--year=".length)) : new Date().getFullYear();
const options = {
  dialect: dialectArg ? dialectArg.slice("--dialect=".length) : "unix",
  fieldMode: modeArg ? modeArg.slice("--mode=".length) : "auto"
};

if (!expression || args.includes("--help") || args.includes("-h")) {
  console.log("Usage: cronscope \"*/5 * * * *\" [--year=2026] [--dialect=unix|quartz|kubernetes|github|aws] [--mode=auto|5|6|7]");
  process.exit(expression ? 0 : 1);
}

const parsed = parseCron(expression, options);
if (!parsed) {
  console.error("Invalid cron expression for selected options.");
  process.exit(2);
}

const times = getFireTimes(parsed, year, 20);
console.log("CronScope " + year);
console.log(describeCron(expression, options));
console.log("");
console.log(asciiHeatmap(parsed, year));
console.log("");
console.log("Next sample runs:");
for (const time of times.slice(0, 10)) console.log("  " + time.toISOString());
