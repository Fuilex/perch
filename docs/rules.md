# Rules

You build rules in the app — Rules › New rule. The editor picks the right input
for each condition (megabytes for a size, days for an age), offers the template
variables one click away, validates the template with the same code that will run
it, and tells you how many files the rule matches as you type.

Nothing here needs to be typed by hand. This page documents the stored format,
which matters in exactly two places: reading an exported file, and writing one to
import.

## What a rule is

A condition, or several combined with **and**, and one thing to do when they all
hold:

> **if** the name matches `Screenshot*` **and** the file is older than 30 days
> **then** move it to `~/Pictures/Screenshots/{year}-{month}`

Rules are checked top to bottom. With `stop_on_match` set — the default — the
first rule that matches a file wins and the rest are skipped for that file. Turn
it off when several rules should each get a look.

## The stored format

`rules.json`, and the file Settings › Rules exports:

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

`id` has to be a UUID, but import assigns a fresh one, so anything valid will do.
Import also accepts a bare array of rules without the wrapper.

## Conditions

| Type | Value | Matches when |
|------|-------|--------------|
| `Extension` | `"pdf"` | The extension is this, ignoring case |
| `Glob` | `"*.{jpg,png}"` | The filename matches this pattern |
| `Regex` | `"^IMG_\\d+"` | The filename matches this expression |
| `SizeGreater` | `1048576` | The file is larger than this many **bytes** |
| `SizeSmaller` | `1024` | The file is smaller than this many **bytes** |
| `OlderThan` | `259200` | Last modified more than this many **seconds** ago |
| `NewerThan` | `3600` | Last modified less than this many seconds ago |

Sizes are bytes and ages are seconds because that is what gets stored; the editor
does the conversion so you can think in MB and days.

### Not implemented

These three parse and save, but `matcher.rs` returns `true` for every file — a
rule using one of them matches **everything**, which is rarely what anyone wants.
The rule editor does not offer them, and they are listed here only so an
imported file containing one is not a mystery.

| Type | Intended meaning |
|------|------------------|
| `MimeType` | MIME type prefix |
| `Duplicate` | Same SHA-256 as another file in the folder |
| `MaxDepth` | No deeper than N folders from the watched root |

## Actions

| Type | Fields | Does |
|------|--------|------|
| `Move` | `dest_template` | Moves the file, creating folders on the way |
| `Copy` | `dest_template` | Copies it, leaving the original |
| `Rename` | `template` | Renames in place |
| `Trash` | — | Sends it to the system recycle bin |

A name collision at the destination is resolved by appending `_1`, `_2` and so
on, rather than overwriting.

### Not implemented

`Unzip` and `RunCommand` are accepted and written to the history, but the
executor does nothing for them — the operation is recorded and the file is left
alone.

## Template variables

Usable in `dest_template` and `template`.

| Variable | Example | Is |
|----------|---------|-----|
| `{name}` | `report` | Filename without the extension |
| `{ext}` | `pdf` | Extension, no dot |
| `{year}` | `2026` | Current year, 4 digits |
| `{month}` | `07` | Current month, 2 digits |
| `{day}` | `27` | Current day, 2 digits |
| `{hour}` | `14` | Current hour, 2 digits |
| `{minute}` | `30` | Current minute, 2 digits |
| `{counter}` | `001` | Counts up within one batch |
| `{hash8}` | `a1b2c3d4` | First 8 characters of the file's SHA-256 |
| `{source_folder}` | `Downloads` | Name of the folder it came from |

A leading `~` is your home folder. A destination with no `{name}` and no
extension is treated as a folder, and the original filename is appended — so
`~/Documents/PDFs` does the obvious thing.

Anything in braces that is not on this list is rejected while you type, and the
editor names it.
