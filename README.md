<p align="center">
  <img src="src-tauri/icons/128x128.png" width="88" alt="Perch" />
</p>

<h1 align="center">Perch</h1>
<p align="center"><strong>Keeps your folders tidy, automatically.</strong></p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-white?style=flat-square" alt="MIT" /></a>
  <img src="https://img.shields.io/badge/platform-Win%20%7C%20Mac%20%7C%20Linux-white?style=flat-square" alt="Platforms" />
  <img src="https://img.shields.io/badge/version-0.1.0-white?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/UI-Русский%20%7C%20English-white?style=flat-square" alt="Languages" />
</p>

---

> Hazel, but free, open-source, cross-platform — and more beautiful than anything you've installed.

Point Perch at a folder, describe what should happen to what, and it does the filing. Nothing leaves the machine: no account, no cloud, no telemetry, no network calls at all.

<!-- GIF demos go here:
1. Creating a rule + dry-run preview (rule editor → dry-run results table)
2. Real-time file organization (watch folder activity timeline filling up)
3. Undo in action (apply → undo → files restored to original locations)
-->

## Features

- **Rule-based automation** — extension, name pattern, regex, size, age; combined with *and*
- **Ready-made rules** — six presets to start from, so the first rule isn't a blank form
- **Dry-run first** — see every operation before it runs, and deselect any of them
- **Full undo** — every operation is journalled; undo a single file or an entire batch
- **Template paths** — `{name}`, `{ext}`, `{year}`, `{month}`, `{day}`, `{hour}`, `{minute}`, `{counter}`, `{hash8}`, `{source_folder}`
- **Watched folders** — filesystem events, with a settle delay so half-written downloads are left alone
- **Drag and drop** — drop a folder on the window to start watching it
- **Quiet hours** — a daily window where nothing is organized automatically
- **Optional password** — a local profile locks the window and the commands behind it
- **Russian and English** — Russian by default, switchable in Settings
- **Everything in the app** — no config file to hand-edit; Settings shows you where the files live anyway
- **JSON rules** — import, export, share, version-control

## Install

| OS | Download |
|----|----------|
| Windows 10+ | [`Perch_0.1.0_x64-setup.exe`](https://github.com/Fuilex/perch/releases) |
| macOS 12+ | [`Perch_0.1.0.dmg`](https://github.com/Fuilex/perch/releases) |
| Linux | [`Perch_0.1.0.AppImage`](https://github.com/Fuilex/perch/releases) / `.deb` |

Or run it from source:

```bash
npm install
npm run tauri dev
```

`npm run dev` on its own serves the interface in a browser for UI work. There's no backend behind it, so the window says so and anything touching real files is refused.

### Building on Windows

The Rust GNU toolchain is used, so MinGW has to be on `PATH` for `windres`. The scripts handle that, and refuse early if the project sits in a path with non-ASCII characters — `windres` cannot open files through one, and the error it gives instead blames the icon:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/dev.ps1
powershell -ExecutionPolicy Bypass -File scripts/build.ps1
```

Output lands in `C:\perch-target\release\`: `perch.exe` to run directly, plus an NSIS installer and an MSI under `bundle\`.

Two things that will waste your afternoon otherwise:

- **Closing the window doesn't quit Perch** — it parks in the tray, and a running instance holds `perch.exe` open, so the next build fails with "Отказано в доступе" / "Access denied". Quit from the tray first.
- **Windows caches file icons.** After changing the icon, Explorer keeps showing the old one. `ie4uinit.exe -show`, or delete `%LOCALAPPDATA%\IconCache.db` and restart Explorer.

## Example rule

Rules are stored as JSON, and Settings › Rules exports them in this shape. `id` is required but gets replaced on import, so any UUID will do.

```json
{
  "version": 1,
  "rules": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Archive old screenshots",
      "enabled": true,
      "conditions": [
        { "type": "Glob", "value": "Screenshot*" },
        { "type": "OlderThan", "value": 604800 }
      ],
      "action": {
        "type": "Move",
        "dest_template": "~/Pictures/Screenshots/{year}-{month}"
      },
      "stop_on_match": true,
      "order": 0
    }
  ]
}
```

Sizes are bytes, ages are seconds. Everything is easier to write in the rule editor, which shows how many files a rule matches as you type.

## Where things live

| Path | What's in it |
| --- | --- |
| `src/lib/ipc.ts` | Every backend command, typed. The only file that talks to `@tauri-apps/api`. |
| `src/store/app.ts` | UI state. Mutations go out over IPC and store what comes back. |
| `src/lib/i18n.ts` | Both dictionaries. Russian is the source of truth; English is typed against it. |
| `src/lib/presets.ts` | The ready-made rules. |
| `src/screens/` | Rules, the rule editor, activity, folders, settings, the lock screen. |
| `src/design/` | Tokens, the glass material, appearance settings, hover effects. |
| `src-tauri/src/core/` | Scanner, matcher, planner, executor, journal, templates, accounts. |
| `src-tauri/src/commands/` | The command surface the UI calls. |
| `scripts/gen-icons.mjs` | Builds the whole icon set from `src/assets/mark.svg` (`npm run icons`). |

Your data sits in `Perch/` under the OS local data directory: `config.json` (settings and watched folders), `rules.json`, `journal.db` — the SQLite history that undo reads — and `account.json` if you set a password.

## The password

Optional, and local. There is no server and no sync: signing in unlocks the app on this machine. The password is stored as an Argon2id hash, and the Rust side refuses every data command while the session is locked, so the lock screen isn't the only thing holding the door.

It **gates access; it does not encrypt.** The rules and history files stay readable to anyone who can open the folder. If you forget the password there is nothing to reset it from — delete `account.json` and the lock is gone, with your rules untouched.

## Not implemented yet

Listed so nobody builds a rule on top of one:

- The `Unzip` and `RunCommand` actions are accepted and recorded but don't do anything.
- The `MIME type`, `Is a duplicate` and `Max depth` conditions match every file, so the rule editor doesn't offer them.
- `src-tauri/src/cli` is a placeholder — there is no command-line interface yet.

## FAQ

**Why another file organizer?**
Perch is free, open-source, and cross-platform. It's built with the same attention to detail as the best commercial apps — a Liquid Glass UI, full undo, dry-run previews, and a rule engine that handles real-world edge cases.

**Is it safe?**
Files are never deleted outright — the `Trash` action goes through the system recycle bin. Every operation is journalled, and moves, renames and copies can be undone from the Activity screen.

**Does it phone home?**
No. Zero network requests. No telemetry. No accounts. Everything runs locally.

## Built with

[Tauri 2](https://tauri.app) · [Rust](https://rust-lang.org) · [React](https://react.dev) · [TypeScript](https://typescriptlang.org) · [Framer Motion](https://motion.dev)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Architecture notes are in [docs/architecture.md](docs/architecture.md), the design language in [docs/design-system.md](docs/design-system.md), and the rule format in [docs/rules.md](docs/rules.md). `CHANGELOG.md` records what changed and, where it matters, why.

---

<p align="center"><sub>Perch — by <a href="https://github.com/Fuilex">Fuilex</a> · MIT License</sub></p>
