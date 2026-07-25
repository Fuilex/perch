import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-12)', textAlign: 'center', gap: 'var(--space-3)',
      }}
    >
      {icon && <div style={{ color: 'var(--text-quaternary)', marginBottom: 'var(--space-2)' }}>{icon}</div>}
      <h3 className="text-heading">{title}</h3>
      {description && <p className="text-secondary" style={{ maxWidth: 280 }}>{description}</p>}
      {action && <div style={{ marginTop: 'var(--space-4)' }}>{action}</div>}
    </motion.div>
  );
}
