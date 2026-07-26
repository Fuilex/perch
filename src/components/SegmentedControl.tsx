import { motion } from 'framer-motion';
import { useId } from 'react';
import { springs } from '@/design/tokens';

export interface Segment<T extends string> {
  value: T;
  label: string;
  /** Shown under the control when this segment is selected. */
  hint?: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  segments: ReadonlyArray<Segment<T>>;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: 'sm' | 'md';
  fill?: boolean;
}

/**
 * A pill selector with the selection sliding between options — the shape of
 * control that reads as "pick exactly one of these few".
 */
export function SegmentedControl<T extends string>({
  value,
  segments,
  onChange,
  ariaLabel,
  size = 'md',
  fill = false,
}: SegmentedControlProps<T>) {
  // Scopes the sliding indicator to this instance.
  const layoutId = `segment-${useId()}`;
  const height = size === 'sm' ? 28 : 32;

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      style={{
        display: fill ? 'grid' : 'inline-grid',
        gridAutoFlow: 'column',
        gridAutoColumns: '1fr',
        gap: 2,
        padding: 2,
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'var(--glass-fill)',
        border: '1px solid var(--glass-border-subtle)',
      }}
    >
      {segments.map((segment) => {
        const selected = segment.value === value;
        return (
          <button
            key={segment.value}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(segment.value)}
            style={{
              position: 'relative',
              height,
              padding: `0 ${size === 'sm' ? 10 : 14}px`,
              borderRadius: 'var(--radius-xs)',
              fontSize: size === 'sm' ? '0.75rem' : '0.8125rem',
              fontWeight: selected ? 500 : 400,
              color: selected ? 'var(--accent-ink)' : 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              transition: 'color 160ms var(--ease-out)',
            }}
          >
            {selected && (
              <motion.span
                layoutId={layoutId}
                transition={springs.snappy}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--accent)',
                  zIndex: 0,
                }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>{segment.label}</span>
          </button>
        );
      })}
    </div>
  );
}
