import { motion, AnimatePresence } from 'framer-motion';
import { toastVariants } from '@/design/animations';
import { Glass } from './Glass';
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

export function Toast({ message, visible, onDismiss, duration = 4000, action }: ToastProps) {
  useEffect(() => {
    if (visible && duration > 0) {
      const t = setTimeout(onDismiss, duration);
      return () => clearTimeout(t);
    }
  }, [visible, duration, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          style={{ position: 'fixed', bottom: 24, left: '50%', x: '-50%', zIndex: 400 }}
          variants={toastVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <Glass variant="hud" padding="10px 16px" radius="var(--radius-md)">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap' }}>
              <span className="text-body" style={{ fontSize: '0.8125rem' }}>{message}</span>
              {action && (
                <button
                  onClick={action.onClick}
                  style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.8125rem', textDecoration: 'underline', textUnderlineOffset: 2 }}
                >
                  {action.label}
                </button>
              )}
            </div>
          </Glass>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
