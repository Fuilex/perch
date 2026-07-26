<p align="center">
  <img src="src-tauri/icons/128x128.png" width="88" alt="" />
</p>

<h1 align="center">Perch</h1>

<p align="center">
  <strong>Your folders, tidy, without you touching them.</strong><br />
  <sub>Windows · macOS · Linux · nothing leaves the machine</sub>
</p>

<p align="center">
  <a href="README.md">Русский</a> ·
  <a href="https://github.com/Fuilex/perch/releases">Download</a> ·
  <a href="docs/rules.md">Rules</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-white?style=flat-square" alt="MIT" /></a>
  <a href="https://github.com/Fuilex/perch/releases"><img src="https://img.shields.io/github/v/release/Fuilex/perch?style=flat-square&color=white&include_prereleases" alt="Latest release" /></a>
  <a href="https://github.com/Fuilex/perch/actions"><img src="https://img.shields.io/github/actions/workflow/status/Fuilex/perch/ci.yml?branch=main&style=flat-square&label=CI" alt="CI" /></a>
</p>

<p align="center">
  <img src="docs/media/screenshot.png" width="820" alt="The Rules screen: a rule summarised in one line, with a switch to turn it off" />
</p>

Downloads folder full of installers, screenshots and half-read PDFs? Tell Perch
what belongs where, once. It watches the folders you choose and files things as
they land — locally, with no account, no cloud and no network calls at all.

It shows you what it plans to do before it does it, and everything it has done
can be undone, one file or a whole batch at a time.

## How it works

A rule is a condition and what to do about it. Several conditions combine with
*and*, and rules are checked top to bottom:

> **if** the name matches `Screenshot*` **and** the file is older than 30 days
> **then** move it to `~/Pictures/Screenshots/{year}-{month}`

From there it is your choice: organize automatically as soon as something lands in
a watched folder, or by hand with the Organize button. Either way Perch shows the
list first and any file can be unticked.

Nothing has to be built from scratch. Six ready-made rules ship with the app, and
picking one opens it in the editor where everything is editable:

| Preset | What it does |
| --- | --- |
| Images to Pictures | png, jpg, webp, sorted into years |
| Documents to Documents | pdf, docx, xlsx |
| Archives to their own folder | zip, rar, 7z |
| Old screenshots to an archive | `Screenshot*` older than 30 days, by month |
| Large files set aside | anything over 500 MB |
| Installers to the bin | exe and msi older than 14 days |

The interface is in Russian by default; English is one switch away in Settings.

## What it does

- **Conditions** — extension, name pattern, regex, size, age; combined with *and*
- **Actions** — move, copy, rename, or send to the recycle bin
- **Templates** — `{name}` `{ext}` `{year}` `{month}` `{day}` `{hour}` `{minute}` `{counter}` `{hash8}` `{source_folder}`, with missing folders created on the way
- **Dry run first** — every operation listed before it runs, each one deselectable
- **Undo** — journalled in SQLite; one file or a whole batch
- **Watched folders** — filesystem events with a settle delay, so half-written downloads are left alone
- **Drag and drop** — drop a folder on the window to start watching it
- **Quiet hours** — a daily window where nothing is organized automatically
- **Optional password** — a local profile locks the window and the commands behind it
- **Everything in the app** — no config file to hand-edit; Settings shows you where the files live anyway
- **JSON rules** — import, export, share, version-control
- **No telemetry** — zero network requests, no accounts, fully local

## Settings

Every setting applies immediately and is written to disk at that moment. There is
no Save button.

**Appearance**

| Setting | What it does |
| --- | --- |
| Language | Russian or English |
| Theme | Dark, light, or follow the system |
| Accent | White by default. Colours switches, primary buttons and the hover border |
| Glass | How much the panels blur what is behind them: off, light, medium, heavy. Worth turning off on a slow machine |
| Reduce motion | Keeps state changes, drops the movement |

**Organizing**

| Setting | What it does |
| --- | --- |
| Organize automatically | Apply rules as soon as a watched folder changes |
| Settle time | How long to wait after the last change, so a file still downloading is left alone |
| Review before applying | Show what is about to happen, with each file deselectable |
| Skip hidden files | Leave dotfiles and hidden files alone |
| Quiet hours | A daily window with no automatic organizing. A window crossing midnight works |

**System**

| Setting | What it does |
| --- | --- |
| Start with the system | Adds Perch to startup |
| Tray icon | Lets you reopen Perch once the window is closed |
| Closing the window keeps Perch running | Otherwise the close button quits, and folders stop being organized |

**Account** — set, change or remove the password, or lock the window. More below.

**Rules** — export every rule to a JSON file, or import one, either merging with
what you have or replacing it.

**On disk** — the path to each of the app's files, with a Reveal button that opens
the folder in the file manager.

## Keyboard shortcuts

| Keys | Action |
| --- | --- |
| `Ctrl + K` | Command palette: navigate, organize, add a folder |
| `Ctrl + N` | New rule |
| `Ctrl + ,` | Settings |
| `Esc` | Close whatever is open on top |

## Install

Grab an installer from [Releases](https://github.com/Fuilex/perch/releases):

| OS | File |
|----|------|
| Windows 10+ | `Perch_x.y.z_x64-setup.exe`, or the portable `perch.exe` |
| macOS 12+ | `Perch_x.y.z_aarch64.dmg` (Apple silicon) or `_x64.dmg` (Intel) |
| Linux | `.AppImage` or `.deb` |

### From source

```bash
npm install
npm run tauri dev
```

`npm run dev` on its own serves the interface in a browser for UI work. There is
no backend behind it, so the window says so and anything touching real files is
refused.

<details>
<summary><strong>Building on Windows</strong> — three traps worth knowing about</summary>

```powershell
powershell -ExecutionPolicy Bypass -File scripts/dev.ps1
powershell -ExecutionPolicy Bypass -File scripts/build.ps1
```

**Build for MSVC if you intend to give the result to anyone.** On the GNU
toolchain, `webview2-com` cannot link the WebView2 loader statically, so the
executable ends up importing `WebView2Loader.dll` at runtime. Cargo drops that
DLL next to the binary, which is why the build runs fine on the machine that made
it — but the installer does not carry it, and on someone else's computer the app
dies before it starts:

> Не удаётся продолжить выполнение кода, поскольку система не обнаружила
> WebView2Loader.dll

MSVC links it statically and the problem disappears:

```bash
npx tauri build --target x86_64-pc-windows-msvc
```

The release workflow already builds MSVC, so installers from a tagged release are
unaffected. Only hand-built GNU ones are.

MinGW on `PATH` is what the GNU toolchain needs for `windres`; the scripts put it
there.

The scripts refuse early if the project sits in a path containing non-ASCII
characters. `windres` cannot open files through such a path, and the error it
prints instead blames the icon, which sends you looking in the wrong place.

Output lands in `C:\perch-target\release\`: `perch.exe` to run directly, plus an
NSIS installer and an MSI under `bundle\`.

**Closing the window does not quit Perch.** It parks in the tray, and a running
instance holds `perch.exe` open — so the next build fails with *Access denied*.
Quit from the tray first.

**Windows caches file icons.** After the icon changes, Explorer keeps showing the
old one. Run `ie4uinit.exe -show`, or delete `%LOCALAPPDATA%\IconCache.db` and
restart Explorer.

</details>

<details>
<summary><strong>Cutting a release</strong></summary>

Tag a commit and push the tag. `.github/workflows/release.yml` builds installers
for Windows, both macOS architectures and Linux, then attaches them to a
**draft** release — publishing stays a manual step, so nothing appears on the
releases page until you press the button.

```bash
git tag v0.1.0
git push origin v0.1.0
```

The version in the filenames comes from `version` in `src-tauri/tauri.conf.json`,
so bump that in the same commit you tag.

</details>

## Your data

Rules, folders and every setting are edited in the app and written to disk as you
go. Nothing here is meant to be opened in a text editor — it is listed so you know
what to back up, and what to delete if you want a clean slate.

Everything sits in `Perch/` under the OS local data directory, and Settings ›
On disk shows the exact paths and opens them in the file manager.

| File | What |
| --- | --- |
| `config.json` | Settings and watched folders |
| `rules.json` | Your rules |
| `journal.db` | SQLite history — what undo reads |
| `account.json` | Only if you set a password |

Rules can be exported and imported as JSON from Settings › Rules, for sharing or
keeping in version control. The format is documented in
[docs/rules.md](docs/rules.md).

## The password

Optional, and local. There is no server and no sync: signing in unlocks the app
on this machine. The password is stored as an Argon2id hash, and the Rust side
refuses every data command while the session is locked, so the lock screen is not
the only thing holding the door.

It **gates access; it does not encrypt.** The rules and history files stay
readable to anyone who can open the folder. Forgotten it? There is nothing to
reset it from — delete `account.json` and the lock is gone, rules untouched.

## When something looks wrong

| Symptom | What is going on |
| --- | --- |
| Closed the window, the app is still running | By design: Perch parked in the tray so it can keep organizing. Quit properly from the tray, or turn that off in Settings |
| A rule matches nothing | Open it in the editor — the bottom of the screen says how many files it matches right now. Check the folder is watched and enabled |
| A file went somewhere unexpected | Activity records every operation and undoes it with a button. The rule's destination template is in its description |
| Undo does not bring things back from the bin | The Trash action is undone by the system recycle bin, not by Perch. That is intentional |
| Won't start, complains about WebView2Loader.dll | A GNU build rather than MSVC. Take an installer from Releases; see the build section above |

## Not implemented yet

Listed so nobody builds a rule on top of one:

- `Unzip` and `RunCommand` actions are accepted and recorded, but do nothing.
- The `MIME type`, `Is a duplicate` and `Max depth` conditions match every file,
  so the rule editor does not offer them.
- `src-tauri/src/cli` is a placeholder; there is no command-line interface yet.

## Where things are

| Path | What's in it |
| --- | --- |
| `src/lib/ipc.ts` | Every backend command, typed. The only file that talks to `@tauri-apps/api`. |
| `src/store/app.ts` | UI state. Mutations go out over IPC and store what comes back. |
| `src/lib/i18n.ts` | Both dictionaries. Russian is the source of truth; English is typed against it. |
| `src/lib/presets.ts` | The ready-made rules. |
| `src/screens/` | Rules, the rule editor, activity, folders, settings, lock screen. |
| `src/design/` | Tokens, the glass material, appearance settings, hover effects. |
| `src-tauri/src/core/` | Scanner, matcher, planner, executor, journal, templates, accounts. |
| `src-tauri/src/commands/` | The command surface the UI calls. |
| `scripts/gen-icons.mjs` | Builds the whole icon set from `src/assets/mark.svg` (`npm run icons`). |

Architecture notes: [docs/architecture.md](docs/architecture.md). Design
language: [docs/design-system.md](docs/design-system.md). `CHANGELOG.md` records
what changed and, where it matters, why.

## FAQ

**Is it safe?** Files are never deleted outright — the `Trash` action goes
through the system recycle bin. Every operation is journalled, and moves, renames
and copies can be undone from the Activity screen.

**Does it phone home?** No. Zero network requests, no telemetry, no accounts.

**Why another file organizer?** Because the good ones are paid and
Mac-only, and the free ones look it.

## Built with

[Tauri 2](https://tauri.app) · [Rust](https://rust-lang.org) ·
[React](https://react.dev) · [TypeScript](https://typescriptlang.org) ·
[Framer Motion](https://motion.dev)

Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

---

<p align="center"><sub>by <a href="https://github.com/Fuilex">Fuilex</a> · MIT License</sub></p>
