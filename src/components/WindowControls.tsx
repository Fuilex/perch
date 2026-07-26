import { motion } from 'framer-motion';
import { closeWindow, minimizeWindow, toggleMaximizeWindow } from '@/lib/window';
import { useT } from '@/lib/i18n';
import { useApp } from '@/store/app';

/**
 * Minimise / maximise / close for the undecorated window.
 *
 * Closing goes through the Rust close handler, which parks Perch in the tray
 * when "keep running in the tray" is on — so the label reflects that.
 */
export function WindowControls() {
  const t = useT();
  const minimizeToTray = useApp((s) => Boolean(s.config?.tray_icon && s.config?.minimize_to_tray));

  return (
    <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <ControlButton label={t('chrome.minimize')} onClick={() => void minimizeWindow()}>
        <line x1="5" y1="12" x2="19" y2="12" />
      </ControlButton>

      <ControlButton label={t('chrome.maximize')} onClick={() => void toggleMaximizeWindow()}>
        <rect x="6" y="6" width="12" height="12" rx="2" />
      </ControlButton>

      <ControlButton
        label={minimizeToTray ? t('chrome.closeToTray') : t('chrome.close')}
        danger
        onClick={() => void closeWindow()}
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </ControlButton>
    </div>
  );
}

interface ControlButtonProps {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}

function ControlButton({ label, onClick, danger, children }: ControlButtonProps) {
  return (
    <motion.button
      aria-label={label}
      title={label}
      onClick={onClick}
      whileHover={{ backgroundColor: danger ? 'rgba(255, 69, 58, 0.85)' : 'var(--glass-fill-hover)' }}
      whileTap={{ scale: 0.94 }}
      transition={{ duration: 0.12 }}
      style={{
        width: 30,
        height: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-xs)',
        color: 'var(--text-secondary)',
        backgroundColor: 'transparent',
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </motion.button>
  );
}
