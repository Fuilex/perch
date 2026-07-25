import { motion } from 'framer-motion';

interface ChipProps {
  label: string;
  onRemove?: () => void;
  active?: boolean;
}

export function Chip({ label, onRemove, active }: ChipProps) {
  return (
    <motion.span
      layout
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: active ? 'rgba(255,255,255,0.14)' : 'var(--glass-fill)',
        border: '1px solid var(--glass-border-subtle)',
        fontSize: '0.8125rem',
        color: 'var(--text-primary)',
        fontWeight: active ? 500 : 400,
      }}
    >
      {label}
      {onRemove && (
        <button onClick={onRemove} aria-label={`Remove ${label}`} style={{ display: 'flex', marginLeft: 2, color: 'var(--text-tertiary)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      )}
    </motion.span>
  );
}
