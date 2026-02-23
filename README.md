# CronScope

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Any%20Browser-orange)
![JavaScript](https://img.shields.io/badge/JavaScript-React%2018-61DAFB?logo=react&logoColor=white)
![Status](https://img.shields.io/badge/status-active-success)
![Dependencies](https://img.shields.io/badge/dependencies-zero%20install-brightgreen)

> Full-year cron expression simulator with calendar heatmap visualization, multi-schedule conflict detection, and detailed execution analytics — 100% client-side, zero install.

![Screenshot](screenshot.png)

## Why CronScope?

Every cron tool out there shows you the next 5 runs in a plain text list. That's useless when you're managing production schedules, debugging job overlaps, or trying to understand execution density across an entire year. CronScope gives you the full operational picture at a glance.

## Quick Start

1. Download `cronscope.html`
2. Open in any browser
3. Start typing cron expressions

No server. No install. No dependencies. Just a single HTML file.

```bash
git clone https://github.com/SysAdminDoc/CronScope.git
cd CronScope
# Open cronscope.html in your browser
```

## Features

| Feature | Description |
|---------|-------------|
| Full-Year Heatmap | GitHub-style calendar showing execution density across every day of the year |
| Multi-Expression Support | Add unlimited cron expressions with color-coded labels, layered on the same calendar |
| Conflict Detection | Automatically flags overlapping execution times between expressions with overlap counts |
| Day Drill-Down | Click any heatmap cell to see exact fire times for that day, broken down by expression |
| Hourly Distribution | Stacked bar chart showing when jobs cluster across the 24-hour cycle |
| Stats Panel | Total runs/year, active days, max/day, avg/active day, peak hour, peak day per expression |
| Next 15 Runs | Real-time upcoming execution list across all expressions with color-coded source |
| Plain English Translation | Converts cron syntax to human-readable descriptions inline |
| Presets Library | 12 common scheduling patterns — one click to apply to any expression |
| Year Navigation | Browse any year's schedule with arrow navigation |
| Dark Theme | Deep dark palette — no light mode, no eye strain |
| Zero Config | No build step, no dependencies, no server — one HTML file |

## Usage

### Basic

Type a standard 5-field cron expression:

```
┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12)
│ │ │ │ ┌───────────── day of week (0-7, 0 and 7 = Sunday)
│ │ │ │ │
* * * * *
```

### Supported Syntax

| Syntax | Example | Meaning |
|--------|---------|---------|
| `*` | `* * * * *` | Every unit |
| `,` | `1,15 * * * *` | List — minute 1 and 15 |
| `-` | `0 9-17 * * *` | Range — hours 9 through 17 |
| `/` | `*/5 * * * *` | Step — every 5 minutes |
| Combined | `*/15 9-17 * * 1-5` | Every 15 min, 9 AM–5 PM, weekdays |

### Comparing Schedules

1. Click **+ Add Expression** to add another cron line
2. Give each expression a descriptive label
3. The heatmap layers colors — dominant expression wins cell color
4. If schedules overlap, the **Conflict Detector** panel appears automatically with exact overlap counts

### Presets

Click the grid icon next to any expression to open the presets panel:

| Preset | Expression |
|--------|-----------|
| Every minute | `* * * * *` |
| Every 5 minutes | `*/5 * * * *` |
| Every hour | `0 * * * *` |
| Every 6 hours | `0 */6 * * *` |
| Daily at midnight | `0 0 * * *` |
| Daily at 9 AM | `0 9 * * *` |
| Weekdays at 9 AM | `0 9 * * 1-5` |
| Weekly Sunday midnight | `0 0 * * 0` |
| 1st of month at noon | `0 12 1 * *` |
| Every 15 min, work hours | `*/15 9-17 * * 1-5` |
| Quarterly | `0 0 1 1,4,7,10 *` |
| Yearly Jan 1 midnight | `0 0 1 1 *` |

## How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Cron Parser    │────>│  Fire Time Gen   │────>│  Visualizations  │
│                 │     │                 │     │                 │
│ Tokenizes each  │     │ Iterates year    │     │ Heatmap, stats,  │
│ field, validates │     │ generating all   │     │ hourly dist,     │
│ ranges/steps    │     │ matching dates   │     │ conflict detect  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

All computation happens client-side in the browser. No data leaves your machine. The parser handles all standard cron features: wildcards, ranges, steps, lists, and combinations. Fire times are generated by iterating through every valid month/day/hour/minute combination for the selected year.

## Prerequisites

- Any modern browser (Chrome, Firefox, Edge, Safari)
- That's it

## What It Does and Doesn't Do

**Does:**
- Parse and visualize standard 5-field cron expressions
- Show full-year execution heatmaps with day-level drill-down
- Detect scheduling conflicts between multiple expressions
- Provide execution statistics and hourly distribution analysis
- Work entirely offline after loading

**Doesn't:**
- Support non-standard 6-field (seconds) or 7-field (years) cron
- Support named months/days (`JAN`, `MON`) — use numbers
- Execute or schedule actual jobs
- Send any data anywhere — fully client-side

## FAQ / Troubleshooting

**Q: The heatmap looks empty**
A: Make sure your cron expression is valid — the input border turns red on invalid syntax. Check the "Plain English" sidebar to verify the expression matches your intent.

**Q: Can I use named days/months like `MON` or `JAN`?**
A: Not yet. Use numeric values: `1-5` for Mon–Fri, `1-12` for Jan–Dec.

**Q: The "Next 15 Runs" panel is empty**
A: This panel shows upcoming runs from the current date/time forward. If all your expressions are set to past dates or the current year has no remaining runs, it'll be empty.

**Q: How many expressions can I add?**
A: No hard limit. Performance stays smooth up to ~6 expressions. Beyond that, the conflict detection computation may slow down slightly on complex schedules.

## Contributing

Issues and PRs welcome. If you find a cron edge case that parses incorrectly, open an issue with the expression and expected behavior.

## License

MIT License — see [LICENSE](LICENSE) for details.
