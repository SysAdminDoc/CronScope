# Changelog

All notable changes to CronScope will be documented in this file.

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
