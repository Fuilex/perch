import { forwardRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import type { GlassVariant } from '@/design/tokens';

const variantClasses: Record<GlassVariant, string> = {
  panel: 'glass glass--panel',
  card: 'glass glass--card',
  popover: 'glass glass--popover',
  toolbar: 'glass glass--toolbar',
  sheet: 'glass glass--sheet',
  hud: 'glass glass--hud',
};

interface GlassProps extends HTMLMotionProps<'div'> {
  variant?: GlassVariant;
  interactive?: boolean;
  children?: ReactNode;
  padding?: string;
  radius?: string;
}

export const Glass = forwardRef<HTMLDivElement, GlassProps>(
  ({ variant = 'card', interactive = false, children, padding, radius, className = '', style, ...props }, ref) => {
    const classes = [
      variantClasses[variant],
      interactive ? 'glass--interactive' : '',
      className,
    ].filter(Boolean).join(' ');

    return (
      <motion.div
        ref={ref}
        className={classes}
        style={{
          padding: padding ?? 'var(--space-4)',
          borderRadius: radius ?? 'var(--radius-lg)',
          ...style,
        }}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);

Glass.displayName = 'Glass';
