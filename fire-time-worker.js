import { getFireTimes, parseCron } from "./cronscope-core.js";

export function generateFireTimeBatch(schedules, year, maxResults = 5000) {
  return schedules.map(schedule => {
    const parsed = parseCron(schedule.expression, {
      dialect: schedule.dialect,
      fieldMode: schedule.fieldMode || "auto",
    });
    return {
      id: schedule.id,
      valid: !!parsed,
      times: parsed ? getFireTimes(parsed, year, maxResults).map(time => time.getTime()) : [],
    };
  });
}

if (typeof self !== "undefined" && typeof self.addEventListener === "function") {
  self.addEventListener("message", event => {
    const request = event.data || {};
    const results = generateFireTimeBatch(request.schedules || [], request.year, request.maxResults || 5000);
    self.postMessage({ requestId: request.requestId, year: request.year, results });
  });
}
