<p align="center">
  <img src="src/assets/icons/bird.svg" width="64" alt="Perch" />
</p>

<h1 align="center">Perch</h1>
<p align="center"><strong>Keeps your files organized, automatically.</strong></p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-white?style=flat-square" alt="MIT" /></a>
  <img src="https://img.shields.io/badge/platform-Win%20%7C%20Mac%20%7C%20Linux-white?style=flat-square" alt="Platforms" />
  <img src="https://img.shields.io/badge/version-0.1.0-white?style=flat-square" alt="Version" />
</p>

---

> Hazel, but free, open-source, cross-platform — and more beautiful than anything you've installed.

<!-- GIF demos go here:
1. Creating a rule + dry-run preview (rule editor → dry-run results table)
2. Real-time file organization (watch folder activity timeline filling up)
3. Undo in action (apply → undo → files restored to original locations)
-->

## Features

- **Rule-based automation** — extension, glob, regex, size, age, MIME type, duplicates
- **Dry-run first** — preview every operation before it runs
- **Full undo** — every operation is recorded; undo a single file or an entire batch
- **Template paths** — `{name}`, `{year}`, `{month}`, `{counter}`, `{hash8}` and more
- **Watched folders** — real-time FS events + periodic scans
- **CLI** — `perch run --dry-run`, `perch apply`, `perch undo <id>`
- **YAML rules** — import, export, share, version-control
- **No telemetry** — zero network requests, no accounts, fully local

## Install

| OS | Download |
|----|----------|
| Windows 10+ | [perch-0.1.0-setup.msi](https://github.com/fuilex/perch/releases) |
| macOS 12+ | [Perch-0.1.0.dmg](https://github.com/fuilex/perch/releases) |
| Linux | [perch-0.1.0.AppImage](https://github.com/fuilex/perch/releases) / `.deb` |

Or build from source:

```bash
git clone https://github.com/fuilex/perch.git
cd perch
npm install
cargo tauri build
```

## Example Rules

```yaml
# Organize PDFs by year
- name: PDF Organizer
  conditions:
    - type: Extension
      value: pdf
    - type: OlderThan
      value: 259200  # 3 days
  action:
    type: Move
    dest_template: "~/Documents/Papers/{year}/{name}.{ext}"
  stop_on_match: true
```

```yaml
# Clean up old screenshots
- name: Screenshot Cleanup
  conditions:
    - type: Glob
      value: "Screenshot*"
    - type: OlderThan
      value: 604800  # 7 days
  action:
    type: Move
    dest_template: "~/Archive/Screenshots/{year}-{month}/{name}.{ext}"
```

```yaml
# Trash stale node_modules
- name: Dev Cleanup
  conditions:
    - type: Regex
      value: "^node_modules$"
    - type: OlderThan
      value: 2592000  # 30 days
  action:
    type: Trash
```

## FAQ

**Why another file organizer?**
Perch is free, open-source, and cross-platform. It's built with the same attention to detail as the best commercial apps — a Liquid Glass UI, full undo, dry-run previews, and a rule engine that handles real-world edge cases.

**Is it safe?**
Files are never deleted without going through the system trash. Every operation is logged and fully reversible.

**Does it phone home?**
No. Zero network requests. No telemetry. No accounts. Everything runs locally.

## Built With

[Tauri 2](https://tauri.app) · [Rust](https://rust-lang.org) · [React](https://react.dev) · [TypeScript](https://typescriptlang.org) · [Framer Motion](https://motion.dev)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

<p align="center"><sub>Perch — by <a href="https://github.com/fuilex">Fuilex</a> · MIT License</sub></p>
