import { forwardRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { springs } from '@/design/tokens';

interface IconButtonProps {
  icon: ReactNode;
  label: string;
  size?: number;
  onClick?: () => void;
  disabled?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, size = 32, onClick, disabled }, ref) => (
    <motion.button
      ref={ref}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={disabled ? undefined : 'glow-ring'}
      whileHover={disabled ? undefined : { scale: 1.08, backgroundColor: 'var(--glass-fill-hover)' }}
      whileTap={disabled ? undefined : { scale: 0.9 }}
      transition={springs.snappy}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'transparent',
        color: 'var(--text-secondary)',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'color 150ms ease',
      }}
    >
      {icon}
    </motion.button>
  ),
);
IconButton.displayName = 'IconButton';
