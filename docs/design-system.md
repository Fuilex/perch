# Design System

## Principles

- **Monochrome only** — no color accents. Semantics via icons, weight, contrast.
- **Liquid Glass** — backdrop blur + specular border + noise grain.
- **4pt grid** — all spacing multiples of 4px.
- **Continuous corners** — squircle approximation.
- **Spring physics** — Framer Motion springs, never bezier for position/scale.

## Tokens

All values in [`src/design/tokens.ts`](../src/design/tokens.ts) and [`src/design/tokens.css`](../src/design/tokens.css).

## Glass Variants

| Variant | Blur | Use Case |
|---------|------|----------|
| `panel` | 48px | Sidebar, main panels |
| `card` | 36px | Rule cards, folder cards |
| `popover` | 36px | Dropdowns, command palette |
| `toolbar` | 24px | Title bar, toolbars |
| `sheet` | 48px | Bottom sheets, modals |
| `hud` | 24px | Tray popup, toasts |

## Type Scale

| Name | Size | Weight | Use |
|------|------|--------|-----|
| Hero | 32px | 600 | Screen titles |
| Title | 22px | 600 | Section titles |
| Heading | 17px | 500 | Card titles |
| Body | 15px | 400 | Default text |
| Secondary | 13px | 400 | Descriptions |
| Caption | 11px | 500 | Labels, uppercase |

## Springs

| Name | Stiffness | Damping | Use |
|------|-----------|---------|-----|
| Default | 380 | 32 | Most transitions |
| Soft | 220 | 30 | Large panels |
| Snappy | 600 | 34 | Small controls, hover |

## Components

Glass, Button (primary/secondary/ghost/destructive), IconButton, Input, Toggle, Chip, Card, Sheet, Toast, CommandPalette, EmptyState.

## Accessibility

- Contrast ≥ 4.5:1 (verified against glass backgrounds)
- Full keyboard navigation
- ARIA roles on interactive elements
- `prefers-reduced-motion`: springs → crossfade 120ms
- `prefers-reduced-transparency`: glass → opaque surfaces
- Focus ring: 2px glow, `:focus-visible` only
