import { motion } from 'framer-motion';
import { toggleKnob } from '@/design/animations';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
}

export function Toggle({ checked, onChange, label, disabled, id }: ToggleProps) {
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
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        style={{
          width: 44,
          height: 24,
          borderRadius: 'var(--radius-full)',
          backgroundColor: checked ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.10)',
          border: 'none',
          position: 'relative',
          cursor: 'inherit',
          padding: 2,
          transition: 'background-color 180ms ease',
        }}
      >
        <motion.div
          animate={checked ? 'on' : 'off'}
          variants={toggleKnob}
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: 'var(--text-primary)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      </button>
      {label && <span className="text-body">{label}</span>}
    </label>
  );
}
