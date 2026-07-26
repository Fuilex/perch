import { motion } from 'framer-motion';
import { springs } from '@/design/tokens';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Rendered after the number, e.g. "s" or "MB". */
  suffix?: string;
  ariaLabel: string;
}

/** Numeric field with decrement/increment, for small bounded values. */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  suffix,
  ariaLabel,
}: StepperProps) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  const button = (label: string, delta: number, glyph: string) => {
    const disabled = clamp(value + delta) === value;
    return (
      <motion.button
        aria-label={`${label} ${ariaLabel}`}
        onClick={() => onChange(clamp(value + delta))}
        disabled={disabled}
        whileTap={disabled ? undefined : { scale: 0.9 }}
        transition={springs.snappy}
        style={{
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-xs)',
          color: 'var(--text-secondary)',
          opacity: disabled ? 0.3 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '1rem',
          lineHeight: 1,
        }}
      >
        {glyph}
      </motion.button>
    );
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        padding: 2,
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'var(--glass-fill)',
        border: '1px solid var(--glass-border-subtle)',
      }}
    >
      {button('Decrease', -step, '−')}
      <input
        aria-label={ariaLabel}
        value={value}
        inputMode="numeric"
        onChange={(event) => {
          const parsed = Number(event.target.value.replace(/[^\d]/g, ''));
          if (Number.isFinite(parsed)) onChange(clamp(parsed));
        }}
        className="tabular-nums"
        style={{
          width: suffix ? 58 : 44,
          height: 28,
          textAlign: 'center',
          background: 'none',
          border: 'none',
          outline: 'none',
          color: 'var(--text-primary)',
          fontSize: '0.8125rem',
          fontFamily: 'var(--font-text)',
        }}
      />
      {suffix && (
        <span
          className="text-secondary"
          style={{ fontSize: '0.75rem', marginRight: 6, marginLeft: -6, pointerEvents: 'none' }}
        >
          {suffix}
        </span>
      )}
      {button('Increase', step, '+')}
    </div>
  );
}
