# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- The interface now talks to the backend. Every screen reads and writes real
  state through `src/lib/ipc.ts`, a typed wrapper over all of the Rust commands.
- Settings covers the whole configuration: theme, accent, glass intensity,
  reduced motion, language, automatic organizing, settle time, quiet hours,
  review before applying, hidden files, autostart, tray behaviour, rule
  import/export, and where the data files live. Nothing needs hand-editing.
- Russian interface, with English selectable in Settings. Russian is the default.
  Every string, units and relative times included, comes out of a dictionary the
  tests check is complete in both languages.
- A local account: create a profile with a password, sign in, change it, lock, or
  remove it. The password is stored as an Argon2id hash, and the Rust side
  refuses every data command while the session is locked, so the lock screen is
  not the only thing holding the door. It gates access rather than encrypting —
  the rules and history files stay readable on disk, which the UI says plainly.
- Ready-made rules: six presets offered during onboarding and on the empty Rules
  screen. Picking one opens it in the editor rather than saving silently.
- A greeting on first run, and onboarding where the folder picker and the presets
  both do real work instead of being a slideshow.
- Rule editor: per-condition value editors with real units (MB, days), the
  template variables one click away, template validation from the same code that
  runs it, and a live count of the files a rule would touch.
- Review sheet — the dry run, with per-file selection, before anything moves.
- Working window controls (minimise, maximise, close) and a real drag region for
  the undecorated window.
- Activity is grouped into the batches operations ran in, with undo per file or
  per batch, and reveal-in-file-manager.
- Preview mode: `npm run dev` in a plain browser says so instead of failing
  silently, and refuses anything that would touch real files.
- `npm run icons` builds the whole icon set from `src/assets/mark.svg`.
- Tests for the display, rule-editing and translation logic (58 cases).

### Changed
- Liquid glass gained a highlight that follows the pointer across each panel, an
  inner underlight along the bottom edge, and a slight brightness lift on the
  backdrop, so the material reads as thickness rather than as a blur.
- Buttons carry a light travelling around their border on hover, filled ones a
  shine sweeping across, and cards pick out their edge in the accent colour.
- The wordmark is redrawn much lighter — 6.5 stroke against a 46 x-height, with
  wider tracking. The old weight read as heavy rather than minimal.
- The bird is redrawn for the app icon: the wing is a notch cut from the outline
  rather than an enclosed island, which survives being scaled down. The 16 and 32
  pixel icons use a simplified glyph with no notch, since below 48 pixels it
  lands on less than a pixel and only muddies the silhouette.
- White is the standard accent, labelled by its colour rather than as "Mono".
- Logo and app icons come from one vector source, with no background baked into
  the logo.
- The `MIME type`, `Is a duplicate` and `Max depth` conditions are hidden in the
  editor, and `Unzip` / `RunCommand` are flagged: the executor and matcher don't
  implement them, and the three conditions match every file.
- README describes what the app actually does, and lists the gaps above.

### Fixed
- `core/template.rs` did not compile — `PathBuf` was used without importing it.
- `core/store.rs` did not compile — `write_json` needed `?Sized` to take the
  `&[Rule]` that `persist_rules` passes it.
- The taskbar icon was a blurry upscale. `tauri-codegen` takes
  `icon_dir.entries()[0]` from the `.ico` verbatim as the window icon, and the
  entries were ordered smallest-first — so Windows was handed a 16×16 image and
  stretched it. Entries are now written largest-first.
- The GitHub buttons did nothing: `window.open` is swallowed inside the Tauri
  webview. Links go through the shell plugin to the system browser now.
- The window's rounded corners had a dark wedge in each one. The window is
  transparent outside the corner radius, and Windows draws its drop shadow
  around the window's rectangle — so the shadow showed through. `shadow` is off
  and the shell draws its own edge.
- The window corners were rounded in the design and square in fact: the
  background gradient sat on the body, painting straight over the radius.
- The drag region used `-webkit-app-region`, which is Electron's and does nothing
  under Tauri; the title bar could not move the window.
- Theme changes in Settings went into a store nothing was reading.
- The rule editor kept the first rule it was ever given, so opening a second rule
  showed the first one's fields.
- Switching screens could leave the window blank: `AnimatePresence mode="wait"`
  deadlocked when a store update landed mid-exit.
- The button spinner referenced a `spin` keyframe that was never defined.
- The command palette was never mounted, so Ctrl/Cmd+K did nothing.
- Empty states and the About screen sat against the top of the window instead of
  centring.
- Sizes that no unit divides evenly (1536 bytes, say) were rounded on display,
  which silently rewrote the rule on the next edit.
- The window capability was missing the permissions dragging and the window
  controls need.

## [0.1.0] - 2026-07-25

### Added
- Initial release
- Rule engine with 10 condition types and 6 action types
- Path template system with 10 variables
- Dry-run preview with per-file selection
- SQLite undo journal with batch undo
- FS watcher with debounced events
- Folder scanner with depth limits
- Liquid Glass design system (dark/light/auto themes)
- Glass, Button, Input, Toggle, Sheet, Chip, Toast, Card, CommandPalette, EmptyState components
- Rules, Activity, Watched Folders, Settings, Onboarding screens
- Command palette (Ctrl+K / Cmd+K)
- 5 example rulepacks
- CI/CD for Windows, macOS, Linux
