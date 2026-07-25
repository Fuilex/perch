# Good First Issues

These issues are designed for new contributors. Each is self-contained and well-scoped.

---

## 1. Add MIME type detection by file extension
**Labels:** `good first issue`, `core`
Add a mapping from file extensions to MIME types in `src-tauri/src/core/matcher.rs`. Use a static HashMap. Cover the top 30 most common extensions. Add tests.

## 2. Add keyboard shortcut hints to nav items
**Labels:** `good first issue`, `ui`
Show keyboard shortcut badges (e.g., "⌘1") next to each nav item in the sidebar. Use the `text-caption` style. Respect platform (⌘ on Mac, Ctrl on Windows/Linux).

## 3. Add file size formatting utility
**Labels:** `good first issue`, `ui`
Create a `formatFileSize(bytes: number): string` utility that returns human-readable sizes (e.g., "1.2 MB", "340 KB"). Use tabular-nums. Add vitest tests.

## 4. Implement Tooltip component
**Labels:** `good first issue`, `ui`, `design-system`
Create a `Tooltip` component using the glass HUD variant. Show on hover with a short delay (200ms). Position above the trigger by default. Use Framer Motion for enter/exit.

## 5. Add "last run" timestamp to rule cards
**Labels:** `good first issue`, `ui`
Show the relative time since the rule was last triggered (e.g., "2 hours ago") on each rule card. Use a `useRelativeTime` hook.

## 6. Implement Select dropdown component
**Labels:** `good first issue`, `ui`, `design-system`
Create a `Select` component with glass popover dropdown. Support keyboard navigation (arrow keys, Enter, Escape). Use in the rule editor for action type selection.

## 7. Add confirmation dialog for destructive actions
**Labels:** `good first issue`, `ui`
Create a confirmation modal for "Delete Rule" and "Trash" actions. Use the Sheet component. Include a clear warning message and Cancel/Confirm buttons.

## 8. Add YAML syntax validation error display
**Labels:** `good first issue`, `core`
When importing rules from YAML, show clear validation errors in the UI. Map `serde_yaml` errors to user-friendly messages. Display them in a Toast.
