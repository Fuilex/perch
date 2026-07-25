# Rules Documentation

## Rule Structure

```yaml
- name: "Rule Name"
  conditions:
    - type: Extension
      value: pdf
  action:
    type: Move
    dest_template: "~/Documents/{year}/{name}.{ext}"
  stop_on_match: true
```

## Conditions

| Type | Value | Description |
|------|-------|-------------|
| `Extension` | `"pdf"` | File extension (case-insensitive) |
| `Glob` | `"*.{jpg,png}"` | Glob pattern on filename |
| `Regex` | `"^IMG_\\d+"` | Regex on filename |
| `SizeGreater` | `1048576` | File larger than N bytes |
| `SizeSmaller` | `1024` | File smaller than N bytes |
| `OlderThan` | `259200` | Modified more than N seconds ago |
| `NewerThan` | `3600` | Modified less than N seconds ago |
| `MimeType` | `"image/"` | MIME type prefix |
| `Duplicate` | — | SHA-256 duplicate in same folder |
| `MaxDepth` | `2` | Max directory depth from root |

## Actions

| Type | Fields | Description |
|------|--------|-------------|
| `Move` | `dest_template` | Move file to destination |
| `Copy` | `dest_template` | Copy file to destination |
| `Rename` | `template` | Rename file in place |
| `Trash` | — | Move to system trash |
| `Unzip` | `dest_template` | Extract archive |
| `RunCommand` | `command` | Run shell command (requires confirmation) |

## Template Variables

| Variable | Example Output | Description |
|----------|---------------|-------------|
| `{name}` | `report` | Filename without extension |
| `{ext}` | `pdf` | File extension |
| `{year}` | `2026` | Current 4-digit year |
| `{month}` | `07` | Current 2-digit month |
| `{day}` | `25` | Current 2-digit day |
| `{hour}` | `14` | Current 2-digit hour |
| `{minute}` | `30` | Current 2-digit minute |
| `{counter}` | `001` | Auto-incrementing counter |
| `{hash8}` | `a1b2c3d4` | First 8 chars of SHA-256 |
| `{source_folder}` | `Downloads` | Source folder name |

## Evaluation Order

Rules are evaluated top-to-bottom. When `stop_on_match` is true (default), the first matching rule wins and subsequent rules are skipped for that file.
