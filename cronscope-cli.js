import { asciiHeatmap, describeCron, getFireTimes, getNextFireTime, getPreviousFireTime, parseCron } from "./cronscope-core.js";

export const CLI_VERSION = "0.3.1";
export const DEFAULT_SAMPLE_LIMIT = 20000;

function commandLabel(command, fallback) {
  const tokens = command.trim().split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(token)) continue;
    const value = token.replace(/^["'`]|["'`]$/g, "");
    const parts = value.split(/[\\/]/);
    if (parts[parts.length - 1]) return parts[parts.length - 1];
  }
  return fallback;
}

function parseEntry(expression, command, lineNumber, options, label) {
  const parsed = parseCron(expression, options);
  return {
    expression,
    label:label || commandLabel(command, expression),
    command:command.trim(),
    lineNumber,
    parsed,
  };
}

export function parseCrontab(text, inputOptions = {}) {
  const options = { dialect:"unix", fieldMode:"auto", ...inputOptions };
  const mode = String(options.fieldMode);
  const width = mode === "auto" ? 5 : Number(mode);
  const system = options.system === true;
  if (![5, 6, 7].includes(width)) return [];

  return String(text).split(/\r?\n/).flatMap((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || /^[A-Za-z_][A-Za-z0-9_]*\s*=/.test(trimmed)) return [];
    const tokens = trimmed.split(/\s+/);
    if (tokens[0].startsWith("@")) {
      return [parseEntry(tokens[0], tokens.slice(1).join(" "), index + 1, options)];
    }
    if (tokens.length <= width) return [];
    const expression = tokens.slice(0, width).join(" ");
    const commandIndex = width + (system ? 1 : 0);
    if (tokens.length <= commandIndex) return [];
    return [parseEntry(expression, tokens.slice(commandIndex).join(" "), index + 1, options)];
  });
}

export function createSchedules(expressions, inputOptions = {}) {
  const options = { dialect:"unix", fieldMode:"auto", ...inputOptions };
  return expressions.map((entry, index) => {
    if (typeof entry === "string") return parseEntry(entry, "", index + 1, options, entry);
    return parseEntry(entry.expression, entry.command || "", entry.lineNumber || index + 1, options, entry.label);
  });
}

export function summarizeSchedule(schedule, year, pivot = new Date(), maxRuns = DEFAULT_SAMPLE_LIMIT) {
  const { parsed } = schedule;
  if (!parsed) {
    return {
      label:schedule.label,
      expression:schedule.expression,
      lineNumber:schedule.lineNumber,
      valid:false,
      description:"Invalid expression for selected options.",
      runCount:0,
      truncated:false,
      previous:null,
      next:null,
      sample:[],
    };
  }
  const times = getFireTimes(parsed, year, maxRuns);
  const previous = getPreviousFireTime(parsed, pivot);
  const next = getNextFireTime(parsed, pivot);
  return {
    label:schedule.label,
    expression:schedule.expression,
    command:schedule.command,
    lineNumber:schedule.lineNumber,
    valid:true,
    description:describeCron(schedule.expression, { dialect:parsed.dialect, fieldMode:parsed.fieldMode }),
    runCount:times.length,
    truncated:times.length >= maxRuns,
    previous:previous ? previous.toISOString() : null,
    next:next ? next.toISOString() : null,
    sample:times.slice(0, 10).map(time => time.toISOString()),
  };
}

export function renderTerminal(schedules, year, options = {}, pivot = new Date()) {
  const lines = [`CronScope ${year}`, `Schedules: ${schedules.length}`, ""];
  schedules.forEach((schedule, index) => {
    const summary = summarizeSchedule(schedule, year, pivot, options.maxRuns || DEFAULT_SAMPLE_LIMIT);
    lines.push(`${index + 1}. ${schedule.label} — ${schedule.expression}`);
    if (!summary.valid) {
      lines.push("   INVALID: expression does not match the selected dialect or field mode.", "");
      return;
    }
    lines.push(`   ${summary.description}`);
    lines.push(`   Runs in ${year}: ${summary.runCount}${summary.truncated ? "+ (sample capped)" : ""}`);
    lines.push(`   Previous: ${summary.previous || "none"}`);
    lines.push(`   Next: ${summary.next || "none"}`);
    lines.push("", asciiHeatmap(schedule.parsed, year), "");
  });
  return lines.join("\n");
}

export function renderTui(schedules, year, options = {}, pivot = new Date()) {
  const lines = ["CronScope TUI", `Year: ${year}`, "", "Schedule validation", "-------------------"];
  schedules.forEach((schedule, index) => {
    const fields = schedule.expression.split(/\s+/).join(" | ");
    const summary = summarizeSchedule(schedule, year, pivot, options.maxRuns || DEFAULT_SAMPLE_LIMIT);
    lines.push(`${summary.valid ? "OK " : "ERR"} ${index + 1}: ${schedule.label}`);
    lines.push(`     ${fields}`);
    lines.push(`     ${summary.valid ? summary.description : "Invalid expression for selected options."}`);
    if (summary.valid) lines.push(`     prev ${summary.previous || "none"} | next ${summary.next || "none"}`);
  });
  lines.push("", "Use --json for machine-readable output or --output=report.html for a shareable browser artifact.");
  return lines.join("\n");
}

export function renderJson(schedules, year, options = {}, pivot = new Date()) {
  return JSON.stringify({
    version:CLI_VERSION,
    year,
    options:{ dialect:options.dialect, fieldMode:options.fieldMode },
    schedules:schedules.map(schedule => summarizeSchedule(schedule, year, pivot, options.maxRuns || DEFAULT_SAMPLE_LIMIT)),
  }, null, 2);
}

export function buildEmbeddedHtml(template, state) {
  const marker = "const EMBEDDED_APP_STATE = null;";
  if (!template.includes(marker)) throw new Error("index.html is missing the embedded state marker");
  const json = JSON.stringify(state).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  return template.replace(marker, `const EMBEDDED_APP_STATE = ${json};`);
}

