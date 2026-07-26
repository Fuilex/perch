import { useCallback, useEffect, useMemo, useState } from 'react';
import { MotionConfig, motion } from 'framer-motion';
import { useApp, type Screen } from '@/store/app';
import { useAppearance } from '@/lib/appearance';
import { useT, type TranslationKey } from '@/lib/i18n';
import { usePointerSheen } from '@/lib/sheen';
import { useMaximizedFlag } from '@/lib/window';
import { newRule } from '@/lib/rule';
import { windowEnter } from '@/design/animations';
import { springs } from '@/design/tokens';
import { Logo, Mark } from '@/components/Brand';
import { Button } from '@/components/Button';
import { CommandPalette } from '@/components/CommandPalette';
import { DropZone } from '@/components/DropZone';
import { ToastHost } from '@/components/ToastHost';
import { WindowControls } from '@/components/WindowControls';
import { RulesScreen } from '@/screens/Rules';
import { RuleEditor } from '@/screens/RuleEditor';
import { ReviewSheet } from '@/screens/ReviewSheet';
import { ActivityScreen } from '@/screens/Activity';
import { WatchedFoldersScreen } from '@/screens/WatchedFolders';
import { SettingsScreen } from '@/screens/Settings';
import { AboutScreen } from '@/screens/About';
import { LockScreen } from '@/screens/Lock';
import { Onboarding } from '@/screens/Onboarding';

/** ⌘ on a Mac, Ctrl everywhere else — shown on the palette hint. */
const MODIFIER_KEY =
  typeof navigator !== 'undefined' && /mac/i.test(navigator.platform) ? '⌘' : 'Ctrl';

const NAV: Array<{ id: Screen; labelKey: TranslationKey; icon: JSX.Element }> = [
  {
    id: 'rules',
    labelKey: 'nav.rules',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <line x1="8" y1="6" x2="20" y2="6" />
        <line x1="8" y1="12" x2="20" y2="12" />
        <line x1="8" y1="18" x2="20" y2="18" />
        <line x1="4" y1="6" x2="4.01" y2="6" />
        <line x1="4" y1="12" x2="4.01" y2="12" />
        <line x1="4" y1="18" x2="4.01" y2="18" />
      </svg>
    ),
  },
  {
    id: 'activity',
    labelKey: 'nav.activity',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15.5 14" />
      </svg>
    ),
  },
  {
    id: 'folders',
    labelKey: 'nav.folders',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: 'settings',
    labelKey: 'nav.settings',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  { id: 'about', labelKey: 'nav.about', icon: <Mark size={17} /> },
];

// ---------------------------------------------------------------------------
// Background — slowly drifting monochrome light
// ---------------------------------------------------------------------------

function AnimatedBackground() {
  const blobs = [
    { className: 'animate-blob-drift-1', size: 600, top: '-10%', left: '-5%', alpha: 0.06 },
    { className: 'animate-blob-drift-2', size: 500, bottom: '-15%', right: '-10%', alpha: 0.05 },
    { className: 'animate-blob-drift-3', size: 400, top: '30%', left: '40%', alpha: 0.04 },
    { className: 'animate-blob-drift-4', size: 450, top: '-5%', right: '20%', alpha: 0.05 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* The light against the right edge — see .aurora in motion.css. */}
      <div className="aurora" />
      <div className="aurora aurora--core" />
      <div className="aurora aurora--edge" />

      {blobs.map((blob, index) => (
        <div
          key={index}
          className={`absolute rounded-full ${blob.className}`}
          style={{
            width: blob.size,
            height: blob.size,
            top: blob.top,
            bottom: blob.bottom,
            left: blob.left,
            right: blob.right,
            background: `radial-gradient(circle, rgba(255,255,255,${blob.alpha}) 0%, transparent 70%)`,
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Title bar
// ---------------------------------------------------------------------------

/**
 * The window has no decorations, so this bar provides both the drag handle and
 * the controls. `data-tauri-drag-region` is what Tauri actually listens for —
 * dragging also needs `core:window:allow-start-dragging` in the capability file.
 */
function TitleBar() {
  const t = useT();
  const platform = useApp((s) => s.about?.platform);
  const preview = useApp((s) => s.preview);
  const controlsOnLeft = platform === 'macOS';

  return (
    <div
      data-tauri-drag-region
      className="drag-region"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--titlebar-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-2) 0 var(--space-3)',
        gap: 'var(--space-3)',
        zIndex: 100,
      }}
    >
      {controlsOnLeft ? (
        <WindowControls />
      ) : (
        /* Aligned with the sidebar it sits over, and centred on the controls
           opposite. Left draggable on purpose — it is title bar, after all. */
        <Logo
          height={26}
          style={{
            color: 'var(--text-primary)',
            marginLeft: 'var(--space-2)',
            flexShrink: 0,
            opacity: 0.96,
          }}
        />
      )}

      {preview && (
        <span
          className="text-caption no-drag"
          title={t('chrome.previewHint')}
          style={{
            color: 'var(--text-tertiary)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--glass-fill)',
            border: '1px solid var(--glass-border-subtle)',
          }}
        >
          {t('chrome.preview')}
        </span>
      )}

      {controlsOnLeft ? (
        <Logo
          height={26}
          style={{ color: 'var(--text-primary)', flexShrink: 0, opacity: 0.96 }}
        />
      ) : (
        <WindowControls />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function Sidebar() {
  const t = useT();
  // The largest glass surface in the window, so it shows the sheen best.
  const pointer = usePointerSheen();
  const screen = useApp((s) => s.screen);
  const setScreen = useApp((s) => s.setScreen);
  const stats = useApp((s) => s.stats);
  const togglePalette = useApp((s) => s.togglePalette);

  const status = stats?.quiet_now
    ? { label: t('status.quiet'), live: false }
    : stats?.auto_organize
      ? { label: t('status.watching'), live: true }
      : { label: t('status.manual'), live: false };

  return (
    <motion.nav
      ref={(element: HTMLElement | null) => {
        pointer.ref.current = element;
      }}
      onMouseMove={pointer.onMouseMove}
      onMouseLeave={pointer.onMouseLeave}
      className="glass glass--panel flex flex-col h-full"
      style={{
        width: 'var(--sidebar-width)',
        flexShrink: 0,
        borderRadius: 0,
        padding: 'var(--space-3)',
        paddingTop: 'calc(var(--titlebar-height) + var(--space-1))',
      }}
      variants={windowEnter}
      initial="hidden"
      animate="visible"
      custom={0}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {NAV.map((item) => {
          const active = screen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              aria-current={active ? 'page' : undefined}
              className="no-drag nav-row"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: '7px var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'left',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                transition: 'color 150ms var(--ease-out)',
              }}
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  transition={springs.default}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--glass-fill-hover)',
                    boxShadow: 'inset 0 0 0 1px var(--glass-border-subtle)',
                  }}
                />
              )}
              <span
                className="nav-icon"
                style={{
                  position: 'relative',
                  zIndex: 1,
                  display: 'flex',
                  opacity: active ? 1 : 0.65,
                }}
              >
                {item.icon}
              </span>
              <span
                className="nav-label"
                style={{
                  position: 'relative',
                  zIndex: 1,
                  fontSize: '0.8125rem',
                  fontWeight: active ? 500 : 400,
                }}
              >
                {t(item.labelKey)}
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => togglePalette(true)}
        className="no-drag"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-2)',
          margin: '0 0 var(--space-2)',
          padding: '6px var(--space-3)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-tertiary)',
          fontSize: '0.75rem',
        }}
      >
        <span>{t('nav.commands')}</span>
        <kbd
          className="text-mono"
          style={{
            fontSize: '0.625rem',
            padding: '2px 5px',
            borderRadius: 4,
            backgroundColor: 'var(--glass-fill)',
            border: '1px solid var(--glass-border-subtle)',
          }}
        >
          {MODIFIER_KEY} K
        </kbd>
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '0 var(--space-3)',
          height: 20,
        }}
      >
        <span
          className={status.live ? 'animate-scan-breathe' : undefined}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            flexShrink: 0,
            backgroundColor: status.live ? 'var(--accent)' : 'var(--text-quaternary)',
          }}
        />
        <span className="text-caption" style={{ color: 'var(--text-quaternary)' }}>
          {status.label}
        </span>
      </div>
    </motion.nav>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export function App() {
  const t = useT();
  const init = useApp((s) => s.init);
  const ready = useApp((s) => s.ready);
  const loadError = useApp((s) => s.loadError);
  const config = useApp((s) => s.config);
  const screen = useApp((s) => s.screen);
  const setScreen = useApp((s) => s.setScreen);
  const setEditingRule = useApp((s) => s.setEditingRule);
  const paletteOpen = useApp((s) => s.paletteOpen);
  const togglePalette = useApp((s) => s.togglePalette);
  const organize = useApp((s) => s.organize);
  const addFolder = useApp((s) => s.addFolder);
  const ruleCount = useApp((s) => s.rules.length);
  const locked = useApp((s) => Boolean(s.account?.exists && !s.account.unlocked));
  const hasAccount = useApp((s) => Boolean(s.account?.exists));
  const signOut = useApp((s) => s.signOut);

  const [onboarded, setOnboarded] = useState(() => {
    try {
      return localStorage.getItem('perch-onboarded') === '1';
    } catch {
      return false;
    }
  });

  useAppearance(config);
  useMaximizedFlag();

  useEffect(() => {
    void init();
  }, [init]);

  const completeOnboarding = useCallback(() => {
    try {
      localStorage.setItem('perch-onboarded', '1');
    } catch {
      // Private mode or a locked profile — worst case onboarding shows again.
    }
    setOnboarded(true);
  }, []);

  const commands = useMemo(
    () => [
      {
        id: 'new-rule',
        label: t('palette.newRule'),
        description: t('palette.newRuleDesc'),
        action: () => setEditingRule(newRule(ruleCount)),
      },
      {
        id: 'organize',
        label: t('palette.organize'),
        description: t('palette.organizeDesc'),
        action: () => void organize(),
      },
      {
        id: 'add-folder',
        label: t('palette.addFolder'),
        description: t('palette.addFolderDesc'),
        action: () => void addFolder(),
      },
      ...NAV.map((item) => ({
        id: `go-${item.id}`,
        label: t('palette.goTo', { screen: t(item.labelKey) }),
        action: () => setScreen(item.id),
      })),
      ...(hasAccount
        ? [
            {
              id: 'lock',
              label: t('palette.lock'),
              description: t('palette.lockDesc'),
              action: () => void signOut(),
            },
          ]
        : []),
    ],
    [addFolder, hasAccount, organize, ruleCount, setEditingRule, setScreen, signOut, t],
  );

  // Global shortcuts. Anything typed into a field is left alone.
  useEffect(() => {
    // No shortcuts past the lock screen — they would open sheets over it.
    if (locked) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (!meta) return;

      if (event.key.toLowerCase() === 'k') {
        event.preventDefault();
        togglePalette();
      } else if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setEditingRule(newRule(ruleCount));
      } else if (event.key === ',') {
        event.preventDefault();
        setScreen('settings');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [locked, ruleCount, setEditingRule, setScreen, togglePalette]);

  const body = () => {
    switch (screen) {
      case 'rules':
        return <RulesScreen />;
      case 'activity':
        return <ActivityScreen />;
      case 'folders':
        return <WatchedFoldersScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'about':
        return <AboutScreen />;
    }
  };

  return (
    <MotionConfig reducedMotion={config?.reduced_motion ? 'always' : 'user'}>
      <div
        className="window-shell relative h-full w-full overflow-hidden"
      >
        <AnimatedBackground />
        <TitleBar />

        {!ready ? (
          <Splash />
        ) : loadError ? (
          <LoadFailure error={loadError} onRetry={() => void init()} />
        ) : locked ? (
          <LockScreen />
        ) : !onboarded ? (
          <Onboarding onComplete={completeOnboarding} />
        ) : (
          <div className="relative flex h-full" style={{ zIndex: 1 }}>
            <Sidebar />
            <main className="flex-1 overflow-hidden relative">
              <div
                style={{
                  height: '100%',
                  overflowY: 'auto',
                  paddingTop: 'var(--titlebar-height)',
                  paddingLeft: 'var(--space-6)',
                  paddingRight: 'var(--space-6)',
                }}
              >
                {/* Keyed on the screen, so switching remounts and fades in.
                    Deliberately not wrapped in AnimatePresence: `mode="wait"`
                    deadlocks if a store update lands mid-exit, and the outgoing
                    screen stays mounted at opacity 0 with nothing behind it. */}
                <motion.div
                  key={screen}
                  // A column flex box, so a screen can hand a child `flex: 1`
                  // and have it centre in the leftover space.
                  style={{
                    minHeight: 'calc(100% - var(--titlebar-height))',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
                >
                  {body()}
                </motion.div>
              </div>
            </main>
          </div>
        )}

        <DropZone />
        <RuleEditor />
        <ReviewSheet />
        <CommandPalette open={paletteOpen} onClose={() => togglePalette(false)} items={commands} />
        <ToastHost />
      </div>
    </MotionConfig>
  );
}

function Splash() {
  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 0.5, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{ color: 'var(--text-secondary)' }}
      >
        <Mark size={44} />
      </motion.div>
    </div>
  );
}

function LoadFailure({ error, onRetry }: { error: string; onRetry: () => void }) {
  const t = useT();
  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-4)',
        height: '100%',
        padding: 'var(--space-12)',
        textAlign: 'center',
      }}
    >
      <Mark size={36} style={{ color: 'var(--text-quaternary)' }} />
      <h1 className="text-heading">{t('common.loadFailed')}</h1>
      <p className="text-secondary" style={{ maxWidth: 380, fontSize: '0.8125rem' }}>
        {error}
      </p>
      <Button variant="primary" onClick={onRetry}>
        {t('common.tryAgain')}
      </Button>
    </div>
  );
}
