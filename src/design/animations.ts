// ============================================================================
// Perch Animation System
// Framer Motion variants and spring configs for all interaction scenarios.
// Philosophy: the interface doesn't "appear" — it flows. Everything continuous,
// nothing jerky, everything interruptible.
// ============================================================================

import type { Variants, Transition, TargetAndTransition } from 'framer-motion';
import { springs, durations, stagger } from './tokens';

// ---------------------------------------------------------------------------
// Reduced motion helper
// ---------------------------------------------------------------------------

/** Cross-fade fallback for prefers-reduced-motion */
const reducedFade: Transition = { duration: 0.12, ease: 'easeOut' };

function withReducedMotion(
  full: Transition,
  _reduced: Transition = reducedFade,
): Transition {
  return full;
}

// ---------------------------------------------------------------------------
// Window entrance — staggered panel reveal
// ---------------------------------------------------------------------------

export const windowEnter: Variants = {
  hidden: { opacity: 0, scale: 0.98, y: 8 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      ...springs.default,
      delay: i * stagger.panelEntrance,
      opacity: { ...springs.opacity, delay: i * stagger.panelEntrance },
    },
  }),
};

// ---------------------------------------------------------------------------
// Card hover & press
// ---------------------------------------------------------------------------

export const cardHover: TargetAndTransition = {
  scale: 1.008,
  transition: withReducedMotion(springs.snappy),
};

export const cardPress: TargetAndTransition = {
  scale: 0.985,
  transition: { type: 'spring', stiffness: 800, damping: 30, mass: 0.5 },
};

export const cardVariants: Variants = {
  idle: { scale: 1 },
  hover: { scale: 1.008, transition: springs.snappy },
  tap: { scale: 0.985, transition: { type: 'spring', stiffness: 800, damping: 30, mass: 0.5 } },
};

// ---------------------------------------------------------------------------
// Sheet (bottom sheet / modal overlay)
// ---------------------------------------------------------------------------

export const sheetOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: durations.standard } },
  exit: { opacity: 0, transition: { duration: durations.micro } },
};

export const sheetContent: Variants = {
  hidden: { y: '100%', opacity: 0.5 },
  visible: {
    y: 0,
    opacity: 1,
    transition: springs.soft,
  },
  exit: {
    y: '100%',
    opacity: 0.5,
    transition: { ...springs.default, stiffness: 300 },
  },
};

export const sheetBackdropBlur: Variants = {
  hidden: { backdropFilter: 'blur(0px)', WebkitBackdropFilter: 'blur(0px)' },
  visible: {
    backdropFilter: 'blur(32px)',
    WebkitBackdropFilter: 'blur(32px)',
    transition: { duration: durations.standard },
  },
  exit: {
    backdropFilter: 'blur(0px)',
    WebkitBackdropFilter: 'blur(0px)',
    transition: { duration: durations.micro },
  },
};

export const sheetBackground: Variants = {
  normal: { scale: 1, filter: 'brightness(1)' },
  dimmed: {
    scale: 0.97,
    filter: 'brightness(0.6)',
    transition: springs.soft,
  },
};

// ---------------------------------------------------------------------------
// List items — staggered entrance and exit
// ---------------------------------------------------------------------------

export const listContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: stagger.listItem,
    },
  },
};

export const listItem: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      ...springs.default,
      opacity: springs.opacity,
    },
  },
  exit: {
    opacity: 0,
    x: 40,
    height: 0,
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    transition: {
      ...springs.default,
      opacity: { duration: durations.micro },
      height: { duration: durations.standard, delay: 0.05 },
    },
  },
};

// ---------------------------------------------------------------------------
// Toggle switch — spring with overshoot
// ---------------------------------------------------------------------------

export const toggleKnob: Variants = {
  off: {
    x: 0,
    transition: { type: 'spring', stiffness: 500, damping: 28, mass: 0.8 },
  },
  on: {
    x: 20,
    transition: { type: 'spring', stiffness: 500, damping: 28, mass: 0.8 },
  },
};

export const toggleTrack: Variants = {
  off: { backgroundColor: 'rgba(255, 255, 255, 0.10)' },
  on: { backgroundColor: 'rgba(255, 255, 255, 0.30)' },
};

// ---------------------------------------------------------------------------
// Scan pulse — breathing glow on panel edge
// ---------------------------------------------------------------------------

export const scanPulse: Variants = {
  idle: { opacity: 0 },
  scanning: {
    opacity: [0.4, 1, 0.4],
    transition: {
      duration: 2.4,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
};

// ---------------------------------------------------------------------------
// Empty state — parallax cursor reaction
// ---------------------------------------------------------------------------

export const emptyStateParallax = {
  /** Max displacement in px. Call with mouse delta from center. */
  maxOffset: 6,
  transition: { type: 'spring' as const, stiffness: 150, damping: 20 },
};

// ---------------------------------------------------------------------------
// Drag & drop — inset glow
// ---------------------------------------------------------------------------

export const dragOverlay: Variants = {
  idle: {
    boxShadow: 'inset 0 0 0 0 rgba(255, 255, 255, 0)',
    scale: 1,
  },
  dragOver: {
    boxShadow: 'inset 0 0 48px 0 rgba(255, 255, 255, 0.06)',
    scale: 1.005,
    transition: springs.default,
  },
};

// ---------------------------------------------------------------------------
// Command palette
// ---------------------------------------------------------------------------

export const commandPaletteOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: durations.micro } },
  exit: { opacity: 0, transition: { duration: durations.micro } },
};

export const commandPaletteContent: Variants = {
  hidden: { y: -20, opacity: 0, scale: 0.96 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: springs.default,
  },
  exit: {
    y: -12,
    opacity: 0,
    scale: 0.97,
    transition: { duration: durations.micro },
  },
};

// ---------------------------------------------------------------------------
// Fade transitions (generic)
// ---------------------------------------------------------------------------

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: durations.micro, ease: [0.32, 0.72, 0, 1] },
  },
  exit: {
    opacity: 0,
    transition: { duration: durations.micro, ease: [0.32, 0.72, 0, 1] },
  },
};

export const fadeScale: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springs.default,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: durations.micro },
  },
};

// ---------------------------------------------------------------------------
// Toast notification
// ---------------------------------------------------------------------------

export const toastVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.default,
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.95,
    transition: { duration: durations.micro },
  },
};

// ---------------------------------------------------------------------------
// Nav indicator — shared layout
// ---------------------------------------------------------------------------

export const navIndicator: Variants = {
  inactive: {
    opacity: 0,
  },
  active: {
    opacity: 1,
    transition: springs.default,
  },
};

// ---------------------------------------------------------------------------
// Reduced motion variants (crossfade replacements)
// ---------------------------------------------------------------------------

export const reducedMotion = {
  enter: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: reducedFade },
    exit: { opacity: 0, transition: reducedFade },
  },
} as const;
