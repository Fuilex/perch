import { forwardRef, type ReactNode } from 'react';
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

/**
 * `glowColor` is what travels around the border on hover. Filled variants take a
 * white highlight — an accent glow on an accent fill would be invisible — while
 * the see-through ones take the accent itself. `bloom` adds the outer haze, and
 * is left off filled variants so they don't smear.
 */
const variantStyles: Record<
  ButtonVariant,
  { base: React.CSSProperties; glowColor: string; bloom: boolean; shine: boolean }
> = {
  primary: {
    base: { backgroundColor: 'var(--accent)', color: 'var(--accent-ink)', fontWeight: 500 },
    glowColor: 'rgba(255, 255, 255, 0.9)',
    bloom: false,
    shine: true,
  },
  secondary: {
    base: { backgroundColor: 'var(--glass-fill)', color: 'var(--text-primary)', fontWeight: 400 },
    glowColor: 'var(--accent)',
    bloom: true,
    shine: false,
  },
  ghost: {
    base: { backgroundColor: 'transparent', color: 'var(--text-secondary)', fontWeight: 400 },
    glowColor: 'var(--accent)',
    bloom: false,
    shine: false,
  },
  destructive: {
    base: { backgroundColor: '#FF453A', color: '#FFFFFF', fontWeight: 500 },
    glowColor: 'rgba(255, 255, 255, 0.9)',
    bloom: false,
    shine: true,
  },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'secondary', size = 'md', icon, children, loading, disabled, style, className = '', ...props },
    ref,
  ) => {
    const s = sizeStyles[size];
    const v = variantStyles[variant];
    const inert = disabled || loading;

    const classes = [
      inert ? '' : 'glow-ring',
      !inert && v.bloom ? 'glow-ring--bloom' : '',
      !inert && v.shine ? 'shine' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <motion.button
        ref={ref}
        className={classes}
        whileHover={inert ? undefined : { scale: 1.015, y: -1 }}
        whileTap={inert ? undefined : { scale: 0.975, y: 0 }}
        transition={springs.snappy}
        disabled={inert}
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
          ['--glow-color' as string]: v.glowColor,
          ...s,
          ...v.base,
          ...style,
        }}
        {...props}
      >
        {loading ? (
          <span
            style={{
              width: 16,
              height: 16,
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
            }}
          />
        ) : icon ? (
          <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
        ) : null}
        {children && <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';
