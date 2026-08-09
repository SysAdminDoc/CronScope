#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildEmbeddedHtml,
  createSchedules,
  parseCrontab,
  renderJson,
  renderTerminal,
  renderTui,
} from "../cronscope-cli.js";

const USAGE = `Usage:
  cronscope "*/5 * * * *" [--year=2026] [options]
  cronscope --file=crontab.txt [--output=report.html] [options]
  type crontab.txt | cronscope --stdin [--format=json]

Options:
  --year=YYYY                Year to visualize (default: current year)
  --dialect=unix|quartz|kubernetes|github|aws
  --mode=auto|5|6|7         Cron field layout
  --file=PATH                Read a crontab or schedule file
  --stdin                    Read crontab text from stdin
  --system                   Treat crontab input as /etc/cron.d (skip username)
  --format=terminal|json|html
  --json                     Shorthand for --format=json
  --tui                      Render a terminal validation dashboard
  --output=PATH              Write HTML or formatted output to a file
  --pivot=ISO                Pivot for previous/next occurrence queries
  --max-runs=N               Maximum occurrences sampled per schedule
  --help                     Show this help
`;

function parseArgs(args) {
  const options = { expressions:[], format:"terminal" };
  for (const arg of args) {
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--version" || arg === "-v") options.version = true;
    else if (arg === "--stdin") options.stdin = true;
    else if (arg === "--system") options.system = true;
    else if (arg === "--json") options.format = "json";
    else if (arg === "--tui") options.format = "tui";
    else if (arg.startsWith("--")) {
      const separator = arg.indexOf("=");
      const key = separator === -1 ? arg.slice(2) : arg.slice(2, separator);
      const value = separator === -1 ? "" : arg.slice(separator + 1);
      if (["expr", "expression"].includes(key)) options.expressions.push(value);
      else if (["file", "input"].includes(key)) options.file = value;
      else if (key === "output") options.output = value;
      else if (key === "format") options.format = value;
      else if (key === "year") options.year = value;
      else if (key === "dialect") options.dialect = value;
      else if (key === "mode") options.fieldMode = value;
      else if (["pivot", "after", "before"].includes(key)) options.pivot = value;
      else if (key === "max-runs") options.maxRuns = value;
      else if (key === "label") options.label = value;
      else throw new Error(`Unknown option: --${key}`);
    } else options.expressions.push(arg);
  }
  if (options.output && options.format === "terminal" && /\.html?$/i.test(options.output)) options.format = "html";
  return options;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

function parseYear(value) {
  const year = value === undefined ? new Date().getFullYear() : Number(value);
  if (!Number.isInteger(year) || year < 1 || year > 9999) throw new Error("--year must be an integer between 1 and 9999");
  return year;
}

function parsePivot(value) {
  const pivot = value === undefined ? new Date() : new Date(value);
  if (Number.isNaN(pivot.getTime())) throw new Error("--pivot must be a valid ISO timestamp");
  return pivot;
}

function parseMaxRuns(value) {
  const maxRuns = value === undefined ? undefined : Number(value);
  if (maxRuns !== undefined && (!Number.isInteger(maxRuns) || maxRuns < 1)) throw new Error("--max-runs must be a positive integer");
  return maxRuns;
}

async function main() {
  const cli = parseArgs(process.argv.slice(2));
  if (cli.help) {
    console.log(USAGE);
    return;
  }
  if (cli.version) {
    console.log("CronScope " + (process.env.npm_package_version || "0.4.0"));
    return;
  }

  const year = parseYear(cli.year);
  const pivot = parsePivot(cli.pivot);
  const maxRuns = parseMaxRuns(cli.maxRuns);
  const parserOptions = {
    dialect:cli.dialect || "unix",
    fieldMode:cli.fieldMode || "auto",
    system:!!cli.system,
  };
  let schedules;
  if (cli.file || cli.stdin || cli.expressions.length === 0) {
    if (!cli.file && !cli.stdin && cli.expressions.length === 0 && process.stdin.isTTY) throw new Error("No input was provided. Use a quoted expression, --file, or --stdin.\n\n" + USAGE);
    const text = cli.file ? await readFile(resolve(cli.file), "utf8") : await readStdin();
    const imported = parseCrontab(text, parserOptions);
    if (imported.length > 0) schedules = imported;
    else if (text.trim()) schedules = createSchedules([text.trim()], parserOptions);
    else schedules = [];
  } else {
    schedules = createSchedules(cli.expressions, parserOptions);
  }
  if (cli.label && schedules[0]) schedules[0].label = cli.label;
  if (schedules.length === 0) throw new Error("No cron expressions were provided. Use a quoted expression, --file, or --stdin.\n\n" + USAGE);

  const renderOptions = {
    ...parserOptions,
    maxRuns,
  };
  let output;
  if (cli.format === "json") output = renderJson(schedules, year, renderOptions, pivot);
  else if (cli.format === "tui") output = renderTui(schedules, year, renderOptions, pivot);
  else if (cli.format === "html") {
    const template = await readFile(resolve(dirname(fileURLToPath(import.meta.url)), "..", "index.html"), "utf8");
    output = buildEmbeddedHtml(template, {
      exprs:schedules.map(schedule => ({ value:schedule.expression, label:schedule.label })),
      year,
      dialect:parserOptions.dialect,
      mode:parserOptions.fieldMode,
      timezone:"local",
      dstMode:"wall",
    });
  } else output = renderTerminal(schedules, year, renderOptions, pivot);

  if (cli.output) {
    await writeFile(resolve(cli.output), output + (cli.format === "html" ? "" : "\n"), "utf8");
    console.log(`Wrote ${resolve(cli.output)}`);
  } else if (cli.format === "html") process.stdout.write(output);
  else console.log(output);

  if (schedules.some(schedule => !schedule.parsed)) process.exitCode = 2;
}

main().catch(error => {
  console.error("CronScope: " + error.message);
  process.exitCode = 1;
});
