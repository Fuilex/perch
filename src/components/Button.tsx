import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { springs } from '@/design/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  children?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
}

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)', gap: '6px', height: '32px' },
  md: { padding: '8px 16px', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', gap: '8px', height: '36px' },
  lg: { padding: '10px 20px', fontSize: '0.9375rem', borderRadius: 'var(--radius-md)', gap: '8px', height: '40px' },
};

const variantStyles: Record<ButtonVariant, { base: React.CSSProperties; hover: React.CSSProperties }> = {
  primary: {
    base: { backgroundColor: 'var(--text-primary)', color: 'var(--color-bg-from)', fontWeight: 500 },
    hover: { backgroundColor: 'var(--text-secondary)' },
  },
  secondary: {
    base: { backgroundColor: 'var(--glass-fill)', color: 'var(--text-primary)', fontWeight: 400 },
    hover: { backgroundColor: 'var(--glass-fill-hover)' },
  },
  ghost: {
    base: { backgroundColor: 'transparent', color: 'var(--text-secondary)', fontWeight: 400 },
    hover: { backgroundColor: 'var(--glass-fill)' },
  },
  destructive: {
    base: { backgroundColor: 'var(--text-primary)', color: 'var(--color-bg-from)', fontWeight: 600 },
    hover: { backgroundColor: 'var(--text-secondary)' },
  },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', icon, children, loading, disabled, style, ...props }, ref) => {
    const s = sizeStyles[size];
    const v = variantStyles[variant];

    return (
      <motion.button
        ref={ref}
        whileHover={disabled ? undefined : { scale: 1.01 }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        transition={springs.snappy}
        disabled={disabled || loading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          fontFamily: 'var(--font-text)',
          letterSpacing: '0',
          lineHeight: 1,
          transition: 'background-color 150ms ease, opacity 150ms ease',
          ...s,
          ...v.base,
          ...style,
        }}
        {...props}
      >
        {loading ? (
          <span style={{ width: 16, height: 16, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        ) : icon ? (
          <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
        ) : null}
        {children && <span>{children}</span>}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';
