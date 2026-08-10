# Changelog

All notable changes to CronScope will be documented in this file.

## [v0.4.0] - 2026-08-09

- Added Debian-compatible DST handling alongside wall-clock and exact-IANA modes.
- Added bounded previous/next fire-time queries from arbitrary pivot timestamps.
- Added a dependency-free CLI pipeline for crontab stdin/files, JSON/TUI output, and standalone HTML reports.
- Added regression coverage for DST transitions, CLI imports, pivot queries, and embedded report state.

## [v0.3.1] - 2026-08-09

- Added arrow-key navigation for heatmap cells and focus trapping for dialogs.
- Improved Kubernetes CronJob YAML drag-and-drop parsing, including quoted Quartz expressions.
- Added escaped expression legends to SVG and PNG heatmap exports.
- Added shared per-expression schedule snapshots so unchanged schedules reuse computed aggregates.
- Added a bounded fire-time Web Worker with a safe synchronous fallback.
- Hardened dialect parsing for numeric field modes, AWS aliases, Quartz `?`, and stepped values.
- Corrected IANA timezone resolution around skipped and duplicated DST wall-clock times.
- Added a self-contained VS Code hover extension that renders a cron heatmap inline.

## [v0.1.0] - %Y->- (HEAD -> main, origin/main, origin/HEAD)

- Changed: Update README.md
- Changed: Update README.md
- Added: Add files via upload
- Added: Add files via upload

## Roadmap archive — 2026-08-10 — ROADMAP.md

<details>
<summary>Original roadmap snapshot</summary>

```markdown
# CronScope Roadmap

Single-file browser-only cron visualizer with a full-year calendar heatmap, conflict detection, and hourly distribution. Roadmap extends v0.4.0.

## Competitive Research

- **crontab.guru** — Owns the mindshare for "what does this cron mean" with zero visualization; CronScope's heatmap is the clear differentiator, add permalink sharing to match their UX.
- **croner (js)** / **cron-parser** — Mature JS libs for fire-time generation; adopt one as the engine to unlock DST handling, seconds/year fields, and Quartz extensions for free.
- **cronhub / Healthchecks.io** — SaaS monitors that expose schedule visualizations; shows demand but ties to a paid service. CronScope's offline-first niche remains untouched.
- **cron-expression-generator sites** (crontab-generator.org, easycron.com) — Form-based builders without timeline visualization; adding a "builder" tab would close that gap without compromising the core.

## Open-Source Research (Round 2)

### Related OSS Projects
- **harrisiirak/cron-parser** — https://github.com/harrisiirak/cron-parser — JS cron parser with timezone/DST handling, iterator API (`take(n)`, for...of).
- **adhocore/gronx** — https://github.com/adhocore/gronx — Dependency-free Go parser with `NextTick`/`PrevTick` from arbitrary timestamps; standalone runner.
- **cuu508/cronsim** — https://github.com/cuu508/cronsim — Python parser used by Healthchecks.io; matches Debian cron DST quirks exactly.
- **gorhill/cronexpr** — https://github.com/gorhill/cronexpr — Go parser with CLI companion for ad-hoc timestamp queries.
- **takumakanari/cronv** — https://github.com/takumakanari/cronv — CLI that pipes `crontab -l` into an HTML timeline visualization.
- **federatedmedia/cronviz** — https://github.com/federatedmedia/cronviz — SIMILE-timeline renderer from JSON cron dump, motivated by "crontabs are for computers, not humans".
- **techquestsdev/crontab-guru** — https://github.com/techquestsdev/crontab-guru — Go/Bubble Tea TUI with real-time validation and field-specific errors.
- **healthchecks/healthchecks** — https://github.com/healthchecks/healthchecks — OSS cron monitor; source of cronsim and production-grade DST handling.

### Patterns & Architectures Worth Studying
- `cronsim`'s DST test corpus — hundreds of (tz, expr, pivot) tuples with expected next-fires; directly reusable as CronScope's regression suite.
- `cronv` pipeline: stdin → JSON intermediate → template render. Decouples parser from renderer and enables swapping heatmap/timeline/gantt views.
- `harrisiirak/cron-parser` iterator protocol — `for (const date of interval)` pattern keeps memory flat when rendering full-year heatmaps in the browser.

## Implementation Deep Dive (Round 3)

### Reference Implementations to Study
- **bradymholt/cronstrue** — https://github.com/bradymholt/cronstrue — production-grade cron→human text, 25+ locales, Unix + Quartz modes; adopt verbatim for the "Copy-as-markdown plain-English translation" feature
- **harrisiirak/cron-parser** — https://github.com/harrisiirak/cron-parser — canonical JS cron parser with `CronExpression.parse` and `.next()` iteration; works for Unix 5-field + seconds; use for occurrence enumeration
- **JoshOY/quartz-cron-parser** — https://github.com/JoshOY/quartz-cron-parser — Quartz-specific `L`, `W`, `#` handling that harrisiirak doesn't cover; pair both for dialect selector
- **quartz-scheduler issue #592** — https://github.com/quartz-scheduler/quartz/issues/592 — Java reference for Quartz syntax conformance tests; re-encode the test-case matrix in JS to validate the dialect switcher
- **wa0x6e/cal-heatmap** — https://github.com/wa0x6e/cal-heatmap — D3-based year/month/week/day heatmaps with the same zoom levels in the roadmap; MIT
- **Crontab.guru UX** — https://crontab.guru/ — the reference UX for live validation + "next runs" side panel; copy the error-position pointer pattern
- **moment/luxon DateTime.fromISO with zone** — https://github.com/moleculerjs/moleculer/blob/master/src/cron.js — for IANA timezone rendering incl. DST skipped/doubled hours; use Temporal polyfill once native Temporal ships to all targets
- **bradymholt/cron-expression-descriptor** — https://github.com/bradymholt/cron-expression-descriptor — the .NET source for cronstrue; useful when edge-case grammar issues reveal mismatches

### Library Integration Checklist
- **cronstrue 2.50+** — `npm i cronstrue` or `<script type="module">` from jsDelivr; API `cronstrue.toString(expr, { throwExceptionOnParseError: false, verbose: true, locale: 'en' })`; gotcha: locale bundles are separate files (`cronstrue/locales/fr`)
- **cron-parser 4.9+** — occurrence enumeration; `CronExpression.parse(expr, { currentDate, tz: 'America/New_York' })` + iterate `.next()`; gotcha: iterator throws `Error: Out of the timespan range` at the end — wrap in try/catch and treat as end-of-range
- **quartz-cron-parser** or fork with `L-n` + `W` + `#` coverage — wrap behind a `DialectAdapter` interface so the UI can swap Unix/Quartz/Kubernetes at runtime
- **luxon 3.5+** — for zone-aware rendering until Temporal ships; `DateTime.fromJSDate(d, { zone })`; gotcha: luxon 4.x bundle is ~70KB gzip — use tree-shakeable ESM imports or inline only needed parts
- **cal-heatmap 4.2+** — for year/month/week zoom levels; `CalHeatmap.paint({ range: 12 })`; gotcha: needs d3-selection, d3-scale as peer deps — pin to matching D3 v7
- **canvas.toBlob('image/svg+xml')** — doesn't exist natively; use **canvas2svg** https://github.com/gliffy/canvas2svg for SVG export; PNG export via native `canvas.toBlob('image/png', 0.95)`
- **URL state** — `URLSearchParams` + `history.replaceState`; `new URLSearchParams({ expr, label, year })` encoded; gotcha: spaces in cron expressions must be URL-encoded as `+` not `%20` for readability
- **LZ-String** — https://github.com/pieroxy/lz-string — if URL state exceeds practical length for saved schedule sets; `compressToEncodedURIComponent` for shareable permalinks
- **vitest 1.6+** — for cron-dialect test matrix; mirror the Quartz CronExpression test fixtures; gotcha: fake timers + luxon zones — use `vi.setSystemTime` + explicit IANA tz in the `CronExpression.parse` opts
```

</details>
