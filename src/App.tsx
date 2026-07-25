import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { windowEnter } from './design/animations';
import { springs } from './design/tokens';
import logoUrl from './assets/logo.svg';
import { RulesScreen } from './screens/Rules';
import { RuleEditor } from './screens/RuleEditor';
import { ActivityScreen } from './screens/Activity';
import { WatchedFoldersScreen } from './screens/WatchedFolders';
import { SettingsScreen } from './screens/Settings';
import { Onboarding } from './screens/Onboarding';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Screen = 'rules' | 'activity' | 'folders' | 'settings' | 'about';

interface NavItem {
  id: Screen;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'rules', label: 'Rules', icon: 'rules' },
  { id: 'activity', label: 'Activity', icon: 'clock' },
  { id: 'folders', label: 'Watched Folders', icon: 'folder' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'about', label: 'About', icon: 'bird' },
];

// ---------------------------------------------------------------------------
// Theme hook
// ---------------------------------------------------------------------------

function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light' | 'auto'>('dark');

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    if (theme === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      };
      root.setAttribute('data-theme', mq.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  return { theme, setTheme };
}

// ---------------------------------------------------------------------------
// Animated background — slowly drifting monochrome blobs
// ---------------------------------------------------------------------------

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Blob 1 — large, top-left */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full animate-blob-drift-1 opacity-30"
        style={{
          top: '-10%',
          left: '-5%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
        }}
      />
      {/* Blob 2 — medium, bottom-right */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full animate-blob-drift-2 opacity-25"
        style={{
          bottom: '-15%',
          right: '-10%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
        }}
      />
      {/* Blob 3 — small, center */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full animate-blob-drift-3 opacity-20"
        style={{
          top: '30%',
          left: '40%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)',
        }}
      />
      {/* Blob 4 — medium, top-right */}
      <div
        className="absolute w-[450px] h-[450px] rounded-full animate-blob-drift-4 opacity-22"
        style={{
          top: '-5%',
          right: '20%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Navigation sidebar
// ---------------------------------------------------------------------------

interface SidebarProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

function Sidebar({ activeScreen, onNavigate }: SidebarProps) {
  return (
    <motion.nav
      className="glass glass--panel flex flex-col h-full"
      style={{
        width: 'var(--sidebar-width)',
        borderRadius: '0 var(--radius-xl) var(--radius-xl) 0',
        padding: 'var(--space-3)',
        paddingTop: 'calc(var(--titlebar-height) + var(--space-3))',
      }}
      variants={windowEnter}
      initial="hidden"
      animate="visible"
      custom={0}
    >
      {/* Logo */}
      <div className="px-2 mb-6" style={{ marginTop: 'var(--space-2)' }}>
        <img
          src={logoUrl}
          alt="Perch"
          width={140}
          height={47}
          style={{ objectFit: 'contain', objectPosition: 'left' }}
          draggable={false}
        />
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="relative flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors no-drag"
            style={{
              color: activeScreen === item.id
                ? 'var(--text-primary)'
                : 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
            }}
            aria-current={activeScreen === item.id ? 'page' : undefined}
          >
            {/* Active indicator — shared layout animation */}
            {activeScreen === item.id && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute inset-0 rounded-sm"
                style={{
                  backgroundColor: 'var(--glass-fill-hover)',
                  borderRadius: 'var(--radius-sm)',
                }}
                transition={springs.default}
              />
            )}

            {/* Icon placeholder */}
            <span
              className="relative z-10 w-5 h-5 flex items-center justify-center"
              style={{ opacity: activeScreen === item.id ? 1 : 0.6 }}
            >
              <NavIcon name={item.icon} />
            </span>

            {/* Label */}
            <span className="relative z-10 text-secondary" style={{
              fontSize: '0.8125rem',
              fontWeight: activeScreen === item.id ? 500 : 400,
            }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Bottom info */}
      <div className="px-3 py-2">
        <span className="text-caption" style={{ color: 'var(--text-quaternary)' }}>
          v0.1.0
        </span>
      </div>
    </motion.nav>
  );
}

// ---------------------------------------------------------------------------
// Simple icon component (loads inline SVGs)
// ---------------------------------------------------------------------------

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, JSX.Element> = {
    rules: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
    clock: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    folder: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
    settings: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    bird: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8c-2 0-3.5 1-4.5 2.5S11.5 13 10 14c-1.5 1-3 1.5-5 1.5" />
        <path d="M22 6c-1 1-2.5 2-4 2" />
        <circle cx="19" cy="5" r="1" />
        <path d="M5 15.5c0 2 1.5 3.5 3.5 3.5s3.5-1.5 3.5-3.5" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
  };

  return paths[name] ?? null;
}

// ---------------------------------------------------------------------------
// Title bar (custom, with drag region)
// ---------------------------------------------------------------------------

function TitleBar() {
  return (
    <div
      className="drag-region absolute top-0 left-0 right-0 flex items-center justify-between px-4"
      style={{
        height: 'var(--titlebar-height)',
        zIndex: 'var(--titlebar-height)',
      }}
    >
      {/* macOS traffic lights space (left) */}
      <div className="w-20" />

      {/* Center — could hold search trigger */}
      <div />

      {/* Right — window controls on Windows/Linux */}
      <div className="no-drag flex items-center gap-1">
        {/* Window controls will be added per-platform */}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state (welcome screen)
// ---------------------------------------------------------------------------

function EmptyStateContent({ screen }: { screen: Screen }) {
  const labels: Record<Screen, { title: string; description: string }> = {
    rules: {
      title: 'No rules yet',
      description: 'Create your first rule to start organizing files automatically.',
    },
    activity: {
      title: 'No activity',
      description: 'File operations will appear here once rules are applied.',
    },
    folders: {
      title: 'No watched folders',
      description: 'Add a folder to start monitoring for changes.',
    },
    settings: {
      title: 'Settings',
      description: 'Configure Perch to work the way you want.',
    },
    about: {
      title: 'Perch',
      description: 'Organize your files, automatically.',
    },
  };

  const { title, description } = labels[screen];

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full"
      variants={windowEnter}
      initial="hidden"
      animate="visible"
      custom={1}
    >
      {/* Brand icon */}
      <motion.div
        className="mb-6"
        style={{ color: 'var(--text-quaternary)' }}
        custom={2}
        variants={windowEnter}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8c-2 0-3.5 1-4.5 2.5S11.5 13 10 14c-1.5 1-3 1.5-5 1.5" />
          <path d="M22 6c-1 1-2.5 2-4 2" />
          <circle cx="19" cy="5" r="1" />
          <path d="M5 15.5c0 2 1.5 3.5 3.5 3.5s3.5-1.5 3.5-3.5" />
          <line x1="2" y1="20" x2="22" y2="20" />
        </svg>
      </motion.div>

      <motion.h1
        className="text-title mb-2"
        custom={3}
        variants={windowEnter}
      >
        {title}
      </motion.h1>

      <motion.p
        className="text-body"
        style={{ color: 'var(--text-secondary)', maxWidth: '320px', textAlign: 'center' }}
        custom={4}
        variants={windowEnter}
      >
        {description}
      </motion.p>

      {screen === 'about' && (
        <motion.div
          className="mt-8 text-caption"
          style={{ color: 'var(--text-quaternary)' }}
          custom={5}
          variants={windowEnter}
        >
          by Fuilex &middot; MIT License &middot; v0.1.0
        </motion.div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('rules');
  const [onboarded, setOnboarded] = useState(() => {
    try { return localStorage.getItem('perch-onboarded') === '1'; } catch { return false; }
  });
  const _theme = useTheme();

  const handleNavigate = useCallback((screen: Screen) => {
    setActiveScreen(screen);
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    try { localStorage.setItem('perch-onboarded', '1'); } catch {}
    setOnboarded(true);
  }, []);

  if (!onboarded) {
    return (
      <div className="relative h-full w-full overflow-hidden">
        <AnimatedBackground />
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'rules': return <RulesScreen />;
      case 'activity': return <ActivityScreen />;
      case 'folders': return <WatchedFoldersScreen />;
      case 'settings': return <SettingsScreen />;
      case 'about': return (
        <motion.div
          className="flex flex-col items-center justify-center h-full"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <img src={logoUrl} alt="Perch" width={200} height={66} draggable={false} style={{ marginBottom: 'var(--space-6)', opacity: 0.9 }} />
          <p className="text-body" style={{ color: 'var(--text-secondary)' }}>Local file automation, done right.</p>
          <p className="text-caption" style={{ color: 'var(--text-quaternary)', marginTop: 'var(--space-6)' }}>v0.1.0 &middot; by Fuilex &middot; MIT License</p>
        </motion.div>
      );
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <AnimatedBackground />
      <TitleBar />
      <div className="relative flex h-full" style={{ zIndex: 1 }}>
        <Sidebar activeScreen={activeScreen} onNavigate={handleNavigate} />
        <main className="flex-1 overflow-hidden relative">
          <div className="h-full" style={{
            paddingTop: 'var(--titlebar-height)',
            paddingLeft: 'var(--space-6)',
            paddingRight: 'var(--space-6)',
            overflowY: 'auto',
          }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeScreen}
                className="h-full"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
              >
                {renderScreen()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      {/* Rule editor sheet — rendered above everything */}
      <RuleEditor />
    </div>
  );
}
