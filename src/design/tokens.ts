// ============================================================================
// Perch Design Tokens
// Single source of truth for all visual properties.
// No hardcoded values in components — reference these tokens.
// ============================================================================

// ---------------------------------------------------------------------------
// Colors — Monochrome only
// ---------------------------------------------------------------------------

export const colors = {
  dark: {
    bg: { from: '#0A0A0B', to: '#141416' },
    glass: {
      fill: 'rgba(255, 255, 255, 0.06)',
      fillHover: 'rgba(255, 255, 255, 0.09)',
      fillActive: 'rgba(255, 255, 255, 0.04)',
      border: 'rgba(255, 255, 255, 0.10)',
      borderSubtle: 'rgba(255, 255, 255, 0.06)',
      highlight: 'rgba(255, 255, 255, 0.10)',
      separator: 'rgba(255, 255, 255, 0.06)',
    },
    text: {
      primary: '#F5F5F7',
      secondary: 'rgba(245, 245, 247, 0.62)',
      tertiary: 'rgba(245, 245, 247, 0.38)',
      quaternary: 'rgba(245, 245, 247, 0.22)',
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.30)',
      md: '0 1px 2px rgba(0, 0, 0, 0.20), 0 8px 24px rgba(0, 0, 0, 0.28)',
      lg: '0 1px 2px rgba(0, 0, 0, 0.15), 0 8px 24px rgba(0, 0, 0, 0.20), 0 24px 64px rgba(0, 0, 0, 0.25)',
    },
  },
  light: {
    bg: { from: '#FAFAFA', to: '#F0F0F2' },
    glass: {
      fill: 'rgba(255, 255, 255, 0.55)',
      fillHover: 'rgba(255, 255, 255, 0.70)',
      fillActive: 'rgba(255, 255, 255, 0.45)',
      border: 'rgba(0, 0, 0, 0.08)',
      borderSubtle: 'rgba(0, 0, 0, 0.05)',
      highlight: 'rgba(255, 255, 255, 0.60)',
      separator: 'rgba(0, 0, 0, 0.06)',
    },
    text: {
      primary: '#0A0A0B',
      secondary: 'rgba(10, 10, 11, 0.60)',
      tertiary: 'rgba(10, 10, 11, 0.38)',
      quaternary: 'rgba(10, 10, 11, 0.22)',
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.06)',
      md: '0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.08)',
      lg: '0 1px 2px rgba(0, 0, 0, 0.03), 0 8px 24px rgba(0, 0, 0, 0.06), 0 24px 64px rgba(0, 0, 0, 0.08)',
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const typography = {
  fontFamily: {
    display: '-apple-system, "SF Pro Display", "Inter var", Inter, system-ui, sans-serif',
    text: '-apple-system, "SF Pro Text", "Inter var", Inter, system-ui, sans-serif',
    mono: '"SF Mono", "JetBrains Mono", "Fira Code", monospace',
  },
  scale: {
    hero: {
      size: '2rem',
      sizePx: 32,
      weight: 600,
      lineHeight: 1.15,
      tracking: '-0.02em',
      family: 'display' as const,
    },
    title: {
      size: '1.375rem',
      sizePx: 22,
      weight: 600,
      lineHeight: 1.15,
      tracking: '-0.02em',
      family: 'display' as const,
    },
    heading: {
      size: '1.0625rem',
      sizePx: 17,
      weight: 500,
      lineHeight: 1.3,
      tracking: '0',
      family: 'display' as const,
    },
    body: {
      size: '0.9375rem',
      sizePx: 15,
      weight: 400,
      lineHeight: 1.45,
      tracking: '0',
      family: 'text' as const,
    },
    secondary: {
      size: '0.8125rem',
      sizePx: 13,
      weight: 400,
      lineHeight: 1.45,
      tracking: '0',
      family: 'text' as const,
    },
    caption: {
      size: '0.6875rem',
      sizePx: 11,
      weight: 500,
      lineHeight: 1.2,
      tracking: '0.06em',
      textTransform: 'uppercase' as const,
      family: 'text' as const,
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Spacing — 4pt grid
// ---------------------------------------------------------------------------

export const spacing = {
  0: '0px',
  0.5: '2px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;

// ---------------------------------------------------------------------------
// Radii — continuous corners (squircle approximation)
// ---------------------------------------------------------------------------

export const radii = {
  xs: '6px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  full: '9999px',
} as const;

// ---------------------------------------------------------------------------
// Glass material
// ---------------------------------------------------------------------------

export const glass = {
  blur: {
    light: '24px',
    medium: '36px',
    heavy: '48px',
  },
  saturate: '140%',
  noiseOpacity: 0.03,
} as const;

// ---------------------------------------------------------------------------
// Z-index scale
// ---------------------------------------------------------------------------

export const zIndex = {
  base: 0,
  card: 10,
  sticky: 50,
  dropdown: 100,
  sheet: 200,
  modal: 300,
  toast: 400,
  commandPalette: 500,
  tooltip: 600,
  titleBar: 700,
} as const;

// ---------------------------------------------------------------------------
// Animation — Spring configs (Framer Motion)
// ---------------------------------------------------------------------------

export const springs = {
  /** Standard spring for most transitions */
  default: { type: 'spring' as const, stiffness: 380, damping: 32, mass: 0.9 },
  /** Soft spring for large panels and sheets */
  soft: { type: 'spring' as const, stiffness: 220, damping: 30, mass: 0.9 },
  /** Snappy spring for small controls, hovers */
  snappy: { type: 'spring' as const, stiffness: 600, damping: 34, mass: 0.9 },
  /** Ease curve for opacity and color transitions */
  opacity: { duration: 0.18, ease: [0.32, 0.72, 0, 1] as readonly number[] },
} as const;

export const durations = {
  /** Micro interactions: 120–180ms */
  micro: 0.15,
  /** Standard transitions: 240–320ms */
  standard: 0.28,
  /** Large panel/screen transitions: 380–480ms */
  large: 0.42,
} as const;

// ---------------------------------------------------------------------------
// Stagger delays
// ---------------------------------------------------------------------------

export const stagger = {
  /** Delay between nav/panel items on entrance */
  panelEntrance: 0.03,
  /** Delay between list items */
  listItem: 0.018,
  /** Delay for card grid items */
  card: 0.04,
} as const;

// ---------------------------------------------------------------------------
// Combined export
// ---------------------------------------------------------------------------

export const tokens = {
  colors,
  typography,
  spacing,
  radii,
  glass,
  zIndex,
  springs,
  durations,
  stagger,
} as const;

export type Theme = 'dark' | 'light' | 'auto';
export type GlassVariant = 'panel' | 'card' | 'popover' | 'toolbar' | 'sheet' | 'hud';

export default tokens;
