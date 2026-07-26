import { forwardRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { usePointerSheen } from '@/lib/sheen';
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
  /**
   * Highlight that follows the pointer across the surface. On by default for
   * the large surfaces; off for the small floating ones, where a moving
   * highlight on something the size of a toast is just noise.
   */
  sheen?: boolean;
  children?: ReactNode;
  padding?: string;
  radius?: string;
}

const SHEEN_BY_DEFAULT: Record<GlassVariant, boolean> = {
  panel: true,
  card: true,
  sheet: true,
  popover: true,
  toolbar: false,
  hud: false,
};

export const Glass = forwardRef<HTMLDivElement, GlassProps>(
  (
    {
      variant = 'card',
      interactive = false,
      sheen,
      children,
      padding,
      radius,
      className = '',
      style,
      onMouseMove,
      onMouseLeave,
      ...props
    },
    ref,
  ) => {
    const wantsSheen = sheen ?? SHEEN_BY_DEFAULT[variant];
    const pointer = usePointerSheen(wantsSheen);

    const classes = [variantClasses[variant], interactive ? 'glass--interactive' : '', className]
      .filter(Boolean)
      .join(' ');

    return (
      <motion.div
        ref={(element: HTMLDivElement | null) => {
          pointer.ref.current = element;
          if (typeof ref === 'function') ref(element);
          else if (ref) ref.current = element;
        }}
        className={classes}
        onMouseMove={(event) => {
          onMouseMove?.(event);
          pointer.onMouseMove(event);
        }}
        onMouseLeave={(event) => {
          onMouseLeave?.(event);
          pointer.onMouseLeave();
        }}
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
