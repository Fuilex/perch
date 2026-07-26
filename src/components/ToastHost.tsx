import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toastVariants } from '@/design/animations';
import { useT } from '@/lib/i18n';
import { useApp } from '@/store/app';
import { Glass } from './Glass';

const DISMISS_AFTER = 5200;

/**
 * Renders the toast queue as a stack above the window. Errors stay put until
 * dismissed — an operation that failed shouldn't quietly disappear.
 */
export function ToastHost() {
  const t = useT();
  const toasts = useApp((s) => s.toasts);
  const dismiss = useApp((s) => s.dismissToast);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'var(--space-6)',
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-2)',
        zIndex: 400,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} id={toast.id} onDismiss={dismiss}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                maxWidth: 460,
              }}
            >
              {toast.tone === 'error' && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{ flexShrink: 0, color: 'var(--text-secondary)' }}
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
              <span className="text-body" style={{ fontSize: '0.8125rem' }}>
                {toast.text ?? (toast.key ? t(toast.key, toast.params) : '')}
              </span>
              {toast.action && (
                <button
                  onClick={() => {
                    toast.action?.run();
                    dismiss(toast.id);
                  }}
                  style={{
                    color: 'var(--accent)',
                    fontWeight: 500,
                    fontSize: '0.8125rem',
                    flexShrink: 0,
                  }}
                >
                  {t(toast.action.labelKey)}
                </button>
              )}
              <button
                onClick={() => dismiss(toast.id)}
                aria-label={t('toast.dismiss')}
                style={{ color: 'var(--text-tertiary)', display: 'flex', flexShrink: 0 }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </ToastItem>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  id: string;
  onDismiss: (id: string) => void;
  children: React.ReactNode;
}

function ToastItem({ id, onDismiss, children }: ToastItemProps) {
  const tone = useApp((s) => s.toasts.find((t) => t.id === id)?.tone);

  useEffect(() => {
    if (tone === 'error') return;
    const timer = setTimeout(() => onDismiss(id), DISMISS_AFTER);
    return () => clearTimeout(timer);
  }, [id, tone, onDismiss]);

  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ pointerEvents: 'auto' }}
    >
      <Glass variant="hud" padding="10px 14px" radius="var(--radius-md)">
        {children}
      </Glass>
    </motion.div>
  );
}
