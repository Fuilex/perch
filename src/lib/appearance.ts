/**
 * Pushes the persisted appearance settings onto <html>, where appearance.css
 * picks them up. Kept out of React state on purpose: the attributes need to be
 * right before the first paint, and there is only ever one document.
 */

import { useEffect } from 'react';
import type { AppConfig, ThemeName } from './ipc';

const SYSTEM_DARK = '(prefers-color-scheme: dark)';

function resolveTheme(theme: ThemeName): 'dark' | 'light' {
  if (theme !== 'auto') return theme;
  return typeof window !== 'undefined' && window.matchMedia(SYSTEM_DARK).matches ? 'dark' : 'light';
}

/**
 * Applies theme, accent, glass intensity and reduced motion.
 * Safe to call with a partial config — anything missing falls back to the same
 * defaults as `AppConfig::default()` on the Rust side.
 */
export function applyAppearance(config: Partial<AppConfig> | null): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', resolveTheme(config?.theme ?? 'dark'));
  root.setAttribute('data-accent', config?.accent ?? 'mono');
  root.setAttribute('data-glass', config?.glass_intensity ?? 'medium');

  if (config?.reduced_motion) root.setAttribute('data-reduced-motion', '');
  else root.removeAttribute('data-reduced-motion');
}

/** Keeps <html> in step with the config, following the system in auto mode. */
export function useAppearance(config: AppConfig | null): void {
  const theme = config?.theme ?? 'dark';
  const accent = config?.accent ?? 'mono';
  const glass = config?.glass_intensity ?? 'medium';
  const reducedMotion = config?.reduced_motion ?? false;

  useEffect(() => {
    applyAppearance({ theme, accent, glass_intensity: glass, reduced_motion: reducedMotion });

    if (theme !== 'auto') return;

    const query = window.matchMedia(SYSTEM_DARK);
    const onChange = () => {
      document.documentElement.setAttribute('data-theme', query.matches ? 'dark' : 'light');
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [theme, accent, glass, reducedMotion]);
}
