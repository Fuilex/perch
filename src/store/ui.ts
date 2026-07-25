import { create } from 'zustand';

interface UIState {
  activeScreen: string;
  commandPaletteOpen: boolean;
  theme: 'dark' | 'light' | 'auto';
  sheetOpen: boolean;
  setActiveScreen: (s: string) => void;
  toggleCommandPalette: () => void;
  setTheme: (t: 'dark' | 'light' | 'auto') => void;
  setSheetOpen: (o: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeScreen: 'rules',
  commandPaletteOpen: false,
  theme: 'dark',
  sheetOpen: false,
  setActiveScreen: (s) => set({ activeScreen: s }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  setTheme: (t) => set({ theme: t }),
  setSheetOpen: (o) => set({ sheetOpen: o }),
}));
