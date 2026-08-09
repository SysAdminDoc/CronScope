import { parseCron } from "./core.js";

const TOKEN_PATTERN = /\S+/g;

export function findCronCandidates(line, options = { dialect:"unix", fieldMode:"auto" }) {
  const tokens = [...line.matchAll(TOKEN_PATTERN)].map(match => ({
    value:match[0],
    start:match.index,
    end:match.index + match[0].length,
  }));
  const candidates = [];
  for (let start = 0; start < tokens.length; start++) {
    for (let length = 7; length >= 5; length--) {
      if (start + length > tokens.length) continue;
      const expression = tokens.slice(start, start + length).map(token => token.value).join(" ");
      const parsed = parseCron(expression, options);
      if (!parsed) continue;
      candidates.push({
        expression,
        parsed,
        start:tokens[start].start,
        end:tokens[start + length - 1].end,
      });
      break;
    }
  }
  return candidates;
}
