import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sheetOverlay, sheetContent } from '@/design/animations';
import { Glass } from './Glass';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 200 }}
            variants={sheetOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0"
            style={{ zIndex: 201, maxHeight: '85vh' }}
            variants={sheetContent}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Glass variant="sheet" radius="var(--radius-2xl) var(--radius-2xl) 0 0" padding="var(--space-6)">
              <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'var(--glass-border)', margin: '0 auto var(--space-4)' }} />
              {title && <h2 className="text-title" style={{ marginBottom: 'var(--space-4)' }}>{title}</h2>}
              <div style={{ overflowY: 'auto', maxHeight: 'calc(85vh - 100px)' }}>{children}</div>
            </Glass>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
