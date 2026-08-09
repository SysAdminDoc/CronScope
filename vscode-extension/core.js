export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const MONTH_NAMES = { JAN:1,FEB:2,MAR:3,APR:4,MAY:5,JUN:6,JUL:7,AUG:8,SEP:9,OCT:10,NOV:11,DEC:12 };
const DOW_NAMES = { SUN:0,MON:1,TUE:2,WED:3,THU:4,FRI:5,SAT:6 };
const ALIASES = {
  "@yearly":"0 0 1 1 *",
  "@annually":"0 0 1 1 *",
  "@monthly":"0 0 1 * *",
  "@weekly":"0 0 * * 0",
  "@daily":"0 0 * * *",
  "@midnight":"0 0 * * *",
  "@hourly":"0 * * * *"
};
const DIALECTS = {
  unix:{ requiresQuestion:false, allowQuestion:false, dowBase:"unix", awsYear:false },
  quartz:{ requiresQuestion:true, allowQuestion:true, dowBase:"quartz", awsYear:false },
  kubernetes:{ requiresQuestion:false, allowQuestion:false, dowBase:"unix", awsYear:false },
  github:{ requiresQuestion:false, allowQuestion:false, dowBase:"unix", awsYear:false },
  aws:{ requiresQuestion:true, allowQuestion:true, dowBase:"quartz", awsYear:true }
};

export const DEFAULT_OPTIONS = { dialect:"unix", fieldMode:"auto" };

function options(input = {}) {
  return { ...DEFAULT_OPTIONS, ...input };
}

function dialect(name) {
  return DIALECTS[name] || DIALECTS.unix;
}

function resolveNames(field, map) {
  return field.replace(/[A-Za-z]+/g, token => map[token.toUpperCase()] === undefined ? token : String(map[token.toUpperCase()]));
}

function parseField(field, min, max, names) {
  const text = names ? resolveNames(field, names) : field;
  const values = new Set();
  for (const part of text.split(",")) {
    if (part === "*") {
      for (let i = min; i <= max; i++) values.add(i);
      continue;
    }
    const slashParts = part.split("/");
    if (slashParts.length > 2) return null;
    const [range, stepRaw] = slashParts;
    const step = stepRaw === undefined ? 1 : Number(stepRaw);
    if (!Number.isInteger(step) || step < 1) return null;
    const addRange = (a, b) => {
      if (!Number.isInteger(a) || !Number.isInteger(b) || a > b) return false;
      for (let i = a; i <= b; i += step) values.add(i);
      return true;
    };
    if (range === "*") {
      if (!addRange(min, max)) return null;
    } else if (range.includes("-")) {
      const [a, b] = range.split("-").map(Number);
      if (!addRange(a, b)) return null;
    } else {
      const n = Number(range);
      if (!Number.isInteger(n)) return null;
      if (stepRaw === undefined) values.add(n);
      else if (!addRange(n, max)) return null;
    }
  }
  for (const value of values) if (value < min || value > max) return null;
  return values;
}

function parseDowNumber(token, opts) {
  const upper = token.toUpperCase();
  if (DOW_NAMES[upper] !== undefined) return DOW_NAMES[upper];
  const n = Number(token);
  if (!Number.isInteger(n)) return null;
  if (dialect(opts.dialect).dowBase === "quartz") {
    if (n < 1 || n > 7) return null;
    return n === 1 ? 0 : n - 1;
  }
  if (n === 7) return 0;
  return n >= 0 && n <= 6 ? n : null;
}

function addDowRange(values, start, end, step) {
  const all = start <= end
    ? Array.from({ length:end - start + 1 }, (_, i) => start + i)
    : [...Array.from({ length:7 - start }, (_, i) => start + i), ...Array.from({ length:end + 1 }, (_, i) => i)];
  all.forEach((value, index) => { if (index % step === 0) values.add(value); });
}

function parseDowSimple(part, opts) {
  const slashParts = part.split("/");
  if (slashParts.length > 2) return null;
  const [range, stepRaw] = slashParts;
  const step = stepRaw === undefined ? 1 : Number(stepRaw);
  if (!Number.isInteger(step) || step < 1) return null;
  const values = new Set();
  if (range === "*") {
    addDowRange(values, 0, 6, step);
    return values;
  }
  if (range.includes("-")) {
    const [a, b] = range.split("-");
    const start = parseDowNumber(a, opts);
    const end = parseDowNumber(b, opts);
    if (start === null || end === null) return null;
    addDowRange(values, start, end, step);
    return values;
  }
  const single = parseDowNumber(range, opts);
  if (single === null) return null;
  if (stepRaw === undefined) values.add(single);
  else addDowRange(values, single, 6, step);
  return values;
}

function parseDom(field, opts) {
  const d = dialect(opts.dialect);
  const result = { values:new Set(), wildcard:false, noSpecific:false, specials:[] };
  if (field === "*") {
    result.wildcard = true;
    for (let i = 1; i <= 31; i++) result.values.add(i);
    return result;
  }
  if (field === "?") {
    if (!d.allowQuestion) return null;
    result.noSpecific = true;
    return result;
  }
  for (const raw of field.split(",")) {
    const part = raw.toUpperCase();
    if (part === "L") result.specials.push({ type:"lastDay", offset:0 });
    else if (/^L-\d+$/.test(part)) result.specials.push({ type:"lastDay", offset:Number(part.slice(2)) });
    else if (part === "LW") result.specials.push({ type:"lastWeekday" });
    else if (/^\d+W$/.test(part)) result.specials.push({ type:"nearestWeekday", day:Number(part.slice(0, -1)) });
    else {
      const parsed = parseField(raw, 1, 31);
      if (!parsed) return null;
      parsed.forEach(v => result.values.add(v));
    }
  }
  return result;
}

function parseDow(field, opts) {
  const d = dialect(opts.dialect);
  const result = { values:new Set(), wildcard:false, noSpecific:false, specials:[] };
  if (field === "*") {
    result.wildcard = true;
    for (let i = 0; i <= 6; i++) result.values.add(i);
    return result;
  }
  if (field === "?") {
    if (!d.allowQuestion) return null;
    result.noSpecific = true;
    return result;
  }
  for (const raw of field.split(",")) {
    const part = raw.toUpperCase();
    if (/^[A-Z0-9]+L$/.test(part) && part.length > 1) {
      const dow = parseDowNumber(part.slice(0, -1), opts);
      if (dow === null) return null;
      result.specials.push({ type:"lastDow", dow });
    } else if (part.includes("#")) {
      const [dowRaw, nthRaw] = part.split("#");
      const dow = parseDowNumber(dowRaw, opts);
      const nth = Number(nthRaw);
      if (dow === null || !Number.isInteger(nth) || nth < 1 || nth > 5) return null;
      result.specials.push({ type:"nthDow", dow, nth });
    } else if (part === "L") {
      result.specials.push({ type:"lastDow", dow:6 });
    } else {
      const parsed = parseDowSimple(part, opts);
      if (!parsed) return null;
      parsed.forEach(v => result.values.add(v));
    }
  }
  return result;
}

function layout(parts, opts) {
  const d = dialect(opts.dialect);
  const mode = String(opts.fieldMode);
  if (mode !== "auto") {
    if (parts.length !== Number(mode)) return null;
    if (mode === "5") return { hasSeconds:false, hasYear:false, minute:0, hour:1, dom:2, month:3, dow:4 };
    if (mode === "6" && d.awsYear) return { hasSeconds:false, hasYear:true, minute:0, hour:1, dom:2, month:3, dow:4, year:5 };
    if (mode === "6") return { hasSeconds:true, hasYear:false, second:0, minute:1, hour:2, dom:3, month:4, dow:5 };
    return { hasSeconds:true, hasYear:true, second:0, minute:1, hour:2, dom:3, month:4, dow:5, year:6 };
  }
  if (parts.length === 5) return { hasSeconds:false, hasYear:false, minute:0, hour:1, dom:2, month:3, dow:4 };
  if (parts.length === 6 && d.awsYear) return { hasSeconds:false, hasYear:true, minute:0, hour:1, dom:2, month:3, dow:4, year:5 };
  if (parts.length === 6) return { hasSeconds:true, hasYear:false, second:0, minute:1, hour:2, dom:3, month:4, dow:5 };
  if (parts.length === 7) return { hasSeconds:true, hasYear:true, second:0, minute:1, hour:2, dom:3, month:4, dow:5, year:6 };
  return null;
}

export function parseCron(expression, inputOptions = {}) {
  const opts = options(inputOptions);
  const raw = expression.trim();
  if (!raw || raw.toLowerCase() === "@reboot") return null;
  if (raw.startsWith("@")) {
    const alias = ALIASES[raw.toLowerCase()];
    if (!alias) return null;
    const mode = String(opts.fieldMode);
    const expanded = mode === "6" ? (dialect(opts.dialect).awsYear ? alias.split(/\s+/).slice(0, 4).concat("?").join(" ") + " *" : "0 " + alias) : mode === "7" ? "0 " + alias + " *" : alias;
    return parseCron(expanded, opts);
  }
  const unwrapped = opts.dialect === "aws" ? raw.replace(/^cron\((.*)\)$/i, "$1").trim() : raw;
  const parts = unwrapped.split(/\s+/);
  const l = layout(parts, opts);
  if (!l) return null;
  const parsed = {
    raw:unwrapped,
    dialect:opts.dialect,
    seconds:l.hasSeconds ? parseField(parts[l.second], 0, 59) : new Set([0]),
    minutes:parseField(parts[l.minute], 0, 59),
    hours:parseField(parts[l.hour], 0, 23),
    domField:parseDom(parts[l.dom], opts),
    months:parseField(parts[l.month], 1, 12, MONTH_NAMES),
    dowField:parseDow(parts[l.dow], opts),
    years:l.hasYear ? parseField(parts[l.year], 1970, 2199) : null,
    hasSeconds:l.hasSeconds,
    hasYear:l.hasYear,
    fieldMode:String(opts.fieldMode)
  };
  if (!parsed.seconds || !parsed.minutes || !parsed.hours || !parsed.domField || !parsed.months || !parsed.dowField || (l.hasYear && !parsed.years)) return null;
  const d = dialect(opts.dialect);
  const domRestricted = !parsed.domField.wildcard && !parsed.domField.noSpecific;
  const dowRestricted = !parsed.dowField.wildcard && !parsed.dowField.noSpecific;
  if (d.requiresQuestion && (parsed.domField.noSpecific === parsed.dowField.noSpecific)) return null;
  return parsed;
}

function lastDay(year, month) {
  return new Date(year, month, 0).getDate();
}

function nearestWeekday(year, month, day) {
  const max = lastDay(year, month);
  const target = Math.min(day, max);
  const dow = new Date(year, month - 1, target).getDay();
  if (dow === 6) return target === 1 ? 3 : target - 1;
  if (dow === 0) return target === max ? target - 2 : target + 1;
  return target;
}

function lastWeekday(year, month) {
  for (let day = lastDay(year, month); day > 0; day--) {
    const dow = new Date(year, month - 1, day).getDay();
    if (dow >= 1 && dow <= 5) return day;
  }
  return lastDay(year, month);
}

function lastDow(year, month, dow) {
  for (let day = lastDay(year, month); day > 0; day--) if (new Date(year, month - 1, day).getDay() === dow) return day;
  return null;
}

function nthDow(year, month, dow, nth) {
  let count = 0;
  for (let day = 1; day <= lastDay(year, month); day++) {
    if (new Date(year, month - 1, day).getDay() === dow && ++count === nth) return day;
  }
  return null;
}

function matchesDom(field, year, month, day) {
  if (field.wildcard || field.noSpecific || field.values.has(day)) return true;
  return field.specials.some(s => s.type === "lastDay" ? day === lastDay(year, month) - s.offset : s.type === "lastWeekday" ? day === lastWeekday(year, month) : s.type === "nearestWeekday" ? day === nearestWeekday(year, month, s.day) : false);
}

function matchesDow(field, year, month, day) {
  if (field.wildcard || field.noSpecific) return true;
  const dow = new Date(year, month - 1, day).getDay();
  if (field.values.has(dow)) return true;
  return field.specials.some(s => s.type === "lastDow" ? day === lastDow(year, month, s.dow) : s.type === "nthDow" ? day === nthDow(year, month, s.dow, s.nth) : false);
}

export function matchesDate(parsed, year, month, day) {
  const dom = matchesDom(parsed.domField, year, month, day);
  const dow = matchesDow(parsed.dowField, year, month, day);
  if (parsed.domField.noSpecific) return dow;
  if (parsed.dowField.noSpecific) return dom;
  if (parsed.domField.wildcard && parsed.dowField.wildcard) return true;
  if (parsed.domField.wildcard) return dow;
  if (parsed.dowField.wildcard) return dom;
  return dialect(parsed.dialect).requiresQuestion ? dom && dow : dom || dow;
}

export function getFireTimes(parsed, year, maxResults = 5000) {
  if (!parsed || (parsed.years && !parsed.years.has(year))) return [];
  const results = [];
  for (const month of [...parsed.months].sort((a, b) => a - b)) {
    for (let day = 1; day <= lastDay(year, month); day++) {
      if (!matchesDate(parsed, year, month, day)) continue;
      for (const hour of [...parsed.hours].sort((a, b) => a - b)) {
        for (const minute of [...parsed.minutes].sort((a, b) => a - b)) {
          for (const second of [...parsed.seconds].sort((a, b) => a - b)) {
            results.push(new Date(year, month - 1, day, hour, minute, second));
            if (results.length >= maxResults) return results;
          }
        }
      }
    }
  }
  return results;
}

export function getDayCounts(times) {
  const counts = new Map();
  for (const time of times) {
    const key = `${time.getMonth() + 1}-${time.getDate()}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

export function describeCron(expression, inputOptions = {}) {
  const parsed = parseCron(expression, inputOptions);
  if (!parsed) return "Invalid expression";
  const opts = options(inputOptions);
  const fields = expression.trim().replace(/^cron\((.*)\)$/i, "$1").trim().split(/\s+/);
  return `${fields.join(" ")} (${parsed.hasSeconds ? "seconds, " : ""}${parsed.hasYear ? "year-filtered, " : ""}${opts.dialect})`;
}

export function asciiHeatmap(parsed, year) {
  const counts = getDayCounts(getFireTimes(parsed, year, 20000));
  const lines = [];
  for (let month = 1; month <= 12; month++) {
    let line = MONTHS[month - 1] + " ";
    for (let day = 1; day <= lastDay(year, month); day++) {
      const count = counts.get(`${month}-${day}`) || 0;
      line += count === 0 ? "." : count < 5 ? "o" : count < 20 ? "O" : "#";
    }
    lines.push(line);
  }
  return lines.join("\n");
}
