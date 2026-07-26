/**
 * Window chrome. The window is created with `decorations: false`, so minimise,
 * maximise, close and dragging are all ours to provide.
 *
 * Dragging is the one piece that isn't done from here: elements carrying
 * `data-tauri-drag-region` are handled by Tauri itself (and double-clicking one
 * toggles maximise). The old code used `-webkit-app-region: drag`, which is an
 * Electron thing and does nothing here.
 */

import { useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { isTauri } from './ipc';

type AppWindow = ReturnType<typeof getCurrentWindow>;

let cached: AppWindow | null = null;

function appWindow(): AppWindow | null {
  if (!isTauri) return null;
  cached ??= getCurrentWindow();
  return cached;
}

export const minimizeWindow = () => appWindow()?.minimize();
export const closeWindow = () => appWindow()?.close();

export async function toggleMaximizeWindow(): Promise<void> {
  await appWindow()?.toggleMaximize();
}

/**
 * Marks <html> while the window is maximised, so the shell can drop the gutter,
 * the shadow and the rounded corners it floats with. On the root element rather
 * than in React state because #root's own padding depends on it.
 */
export function useMaximizedFlag(): void {
  useEffect(() => {
    const window_ = appWindow();
    if (!window_) return;

    let cancelled = false;
    const sync = async () => {
      const maximized = await window_.isMaximized();
      if (!cancelled) {
        document.documentElement.setAttribute('data-maximized', String(maximized));
      }
    };

    void sync();
    const unlisten = window_.onResized(() => void sync());

    return () => {
      cancelled = true;
      void unlisten.then((off) => off());
    };
  }, []);
}
