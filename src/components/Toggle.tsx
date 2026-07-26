import { motion } from 'framer-motion';
import { toggleKnob } from '@/design/animations';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Visible text beside the switch. Omit when the row already has a label. */
  label?: string;
  /** Accessible name when there is no visible label. */
  ariaLabel?: string;
  disabled?: boolean;
  id?: string;
}

export function Toggle({ checked, onChange, label, ariaLabel, disabled, id }: ToggleProps) {
  const toggleId = id ?? label?.toLowerCase().replace(/\s/g, '-');

  return (
    <label
      htmlFor={toggleId}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <button
        id={toggleId}
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel ?? label}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        style={{
          width: 44,
          height: 24,
          flexShrink: 0,
          borderRadius: 'var(--radius-full)',
          // The "on" track carries the accent; "off" stays neutral in both themes.
          backgroundColor: checked ? 'var(--accent-track)' : 'var(--glass-fill-hover)',
          border: '1px solid var(--glass-border-subtle)',
          position: 'relative',
          cursor: 'inherit',
          padding: 2,
          transition: 'background-color 180ms var(--ease-out)',
        }}
      >
        <motion.div
          animate={checked ? 'on' : 'off'}
          variants={toggleKnob}
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
          }}
        />
      </button>
      {label && <span className="text-body">{label}</span>}
    </label>
  );
}
