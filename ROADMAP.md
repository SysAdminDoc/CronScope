# CronScope Roadmap

Single-file browser-only cron visualizer with a full-year calendar heatmap, conflict detection, and hourly distribution. Roadmap extends v0.1.0.

## Planned Features

### Core Parser
- Support named values (`MON-FRI`, `JAN-DEC`) and aliases (`@hourly`, `@daily`, `@weekly`, `@monthly`, `@yearly`, `@reboot` stubbed)
- 6-field (seconds) mode toggle for Quartz/Kubernetes CronJob dialects
- 7-field (years) mode toggle for Quartz
- `L` (last day-of-month / last weekday), `W` (nearest weekday), `#` (nth weekday) extensions with a dialect selector (Unix vs Quartz vs Kubernetes)
- Timezone selector: visualize a schedule as it would execute in any IANA zone; optional DST-aware rendering that shows skipped/duplicated runs
- Validation panel with inline error highlights + "did you mean" suggestions

### Visualizations
- Month / week / day zoom levels on the heatmap (currently year-only)
- Gantt-style strip showing run density across a 24h timeline for any selected day
- Polar 24-hour clock view layering expressions as arcs
- Diff mode: pick two expressions and render only the cells where they differ (overlap vs exclusive)
- Export current view as PNG / SVG via `canvas.toBlob()` with an embedded legend

### UI/UX
- Persistent state in the URL (`?expr=...&label=...&year=...`) for shareable permalinks
- Save/load "schedule sets" (collection of expressions + labels) to `localStorage`
- Dark/light theme toggle (dark remains default)
- Copy-as-markdown for the plain-English translation
- Accessibility: keyboard nav through heatmap cells, ARIA labels for each day, reduced-motion fallback

### Integrations / Import-Export
- Import from a raw crontab: paste multi-line crontab, each non-comment line becomes a labeled expression
- Import from Kubernetes `CronJob` YAML via drag-and-drop
- Export the analysis as a Markdown report (runs/year, peak hour, conflicts) suitable for a PR description

### Performance
- Web Worker for fire-time generation so the UI stays responsive with 6+ expressions
- Incremental compute: recompute only the affected expression instead of the full set on edit
- Cap per-year fire count with a visible warning ("expression fires > 500k times/year — consider simplifying")

### Packaging
- GitHub Action to publish minified single-file release on tag
- PWA manifest so it installs as a desktop app and works offline after first load
- `npm` / `deno` packageable core parser (`cronscope-core`) so the engine is reusable

## Competitive Research

- **crontab.guru** — Owns the mindshare for "what does this cron mean" with zero visualization; CronScope's heatmap is the clear differentiator, add permalink sharing to match their UX.
- **croner (js)** / **cron-parser** — Mature JS libs for fire-time generation; adopt one as the engine to unlock DST handling, seconds/year fields, and Quartz extensions for free.
- **cronhub / Healthchecks.io** — SaaS monitors that expose schedule visualizations; shows demand but ties to a paid service. CronScope's offline-first niche remains untouched.
- **cron-expression-generator sites** (crontab-generator.org, easycron.com) — Form-based builders without timeline visualization; adding a "builder" tab would close that gap without compromising the core.

## Nice-to-Haves

- Simulate "last N run latencies" and render a histogram for SLA planning
- Overlay holidays / weekends mask and report runs-on-holidays
- CLI wrapper (`npx cronscope "*/5 * * * *"`) that prints an ASCII heatmap in the terminal
- VSCode extension that previews a CronScope heatmap inline when hovering a cron string
- "Why didn't it fire?" debugger that explains why a given timestamp does or doesn't match the expression
- Team mode: publish a schedule set as a GitHub Gist and load it via URL

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

### Features to Borrow
- DST-quirky Debian-cron compatibility mode — borrow from `cronsim` (matches Debian's skip/double-fire behavior on spring-forward / fall-back).
- `crontab -l` pipe ingestion producing a single shareable HTML artifact — borrow from `cronv` (`-o file.html -d 24h` flow).
- Next/Prev tick from arbitrary pivot timestamp, not just "now" — borrow from `gronx` (for backfill / "what would have run during outage" analysis).
- TUI mode with live validation per-field and clipboard round-trip — borrow from `techquestsdev/crontab-guru` Bubble Tea UX.
- Natural-language description per expression (e.g. "At 05:30 on Monday") under the heatmap — borrow from crontab.guru / Chronicle.
- Companion monitoring endpoint that pings a URL when each fire should have occurred — borrow from `healthchecks.io` ping URL pattern.
- Quartz vs Unix vs AWS EventBridge vs GitHub Actions dialect switcher — borrow from the in-browser "cron expression decoder" pattern common across GH topic tools.

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

### Known Pitfalls from Similar Projects
- **Quartz vs Unix day-of-week numbering** — https://www.quartz-scheduler.org/api/2.3.0/org/quartz/CronExpression.html — Unix uses 0-6 (Sun-Sat), Quartz uses 1-7 (Sun-Sat); silent miscalculation if not normalised per dialect
- **DOM/DOW `?` requirement in Quartz** — same doc — Quartz forbids both DOM and DOW being explicit; must emit `?` in one; parser should reject rather than guess
- **`L-n` offset grammar** — Quartz docs above — "3rd-to-last day of month" is `L-3`; many JS parsers refuse it or silently treat as `L`
- **`#5` non-existent weekday** — Quartz docs — "5th Friday" yields zero runs in most months; the heatmap needs to show "never" not "error"
- **DST on IANA zones** — https://tc39.es/proposal-temporal/docs/#ambiguity-due-to-dst — spring-forward skips one run; fall-back duplicates; tests must cover both directions using `America/New_York` transitions
- **`@reboot` alias is meaningless outside a daemon** — https://man7.org/linux/man-pages/man5/crontab.5.html — show a clear "cannot visualise" message instead of silent blank output
- **Quartz year field overflow** — Quartz spec — years 1970-2199 range is enforced; user expressions beyond this must error, not silently cap
- **Large occurrence sets OOM the browser** — cron-parser issue tracker — `* * * * * *` over a year is 31M runs; cap enumeration at N and paginate rather than materialising in memory

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

