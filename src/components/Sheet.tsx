import { useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sheetOverlay, sheetContent } from '@/design/animations';
import { Glass } from './Glass';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Small line under the title — context, not instructions. */
  subtitle?: string;
  /** Pinned below the scrolling body, for the primary actions. */
  footer?: ReactNode;
  /** Caps the content column so text lines stay readable on a wide window. */
  maxWidth?: number;
  children: ReactNode;
}

/**
 * Bottom sheet. Escape closes it, and the body scrolls independently of the
 * footer so the primary action never scrolls out of reach.
 */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  footer,
  maxWidth = 620,
  children,
}: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(6px)', zIndex: 200 }}
            variants={sheetOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0"
            style={{ zIndex: 201 }}
            variants={sheetContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <Glass variant="sheet" radius="var(--radius-2xl) var(--radius-2xl) 0 0" padding="0">
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '88vh',
                  padding: 'var(--space-3) var(--space-6) var(--space-5)',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: 'var(--glass-border)',
                    margin: '0 auto var(--space-4)',
                    flexShrink: 0,
                  }}
                />

                <div
                  style={{
                    width: '100%',
                    maxWidth,
                    margin: '0 auto',
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {title && (
                    <header style={{ flexShrink: 0, marginBottom: 'var(--space-4)' }}>
                      <h2 className="text-title">{title}</h2>
                      {subtitle && (
                        <p className="text-secondary" style={{ fontSize: '0.8125rem', marginTop: 4 }}>
                          {subtitle}
                        </p>
                      )}
                    </header>
                  )}

                  <div style={{ overflowY: 'auto', minHeight: 0, flex: 1, paddingRight: 2 }}>
                    {children}
                  </div>

                  {footer && (
                    <footer
                      style={{
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        marginTop: 'var(--space-4)',
                        paddingTop: 'var(--space-4)',
                        borderTop: '1px solid var(--glass-separator)',
                      }}
                    >
                      {footer}
                    </footer>
                  )}
                </div>
              </div>
            </Glass>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
