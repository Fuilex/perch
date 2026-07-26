import type { SelectHTMLAttributes } from 'react';

interface SelectProps<T extends string | number>
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  /** Numeric selects need the value coerced back on the way out. */
  numeric?: boolean;
  width?: number | string;
}

/**
 * A native select with the platform chrome stripped and a chevron of our own.
 * Native on purpose: the popup list stays keyboard- and screen-reader-correct,
 * which a hand-rolled listbox tends not to be.
 */
export function Select<T extends string | number>({
  value,
  options,
  onChange,
  numeric,
  width,
  style,
  ...props
}: SelectProps<T>) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <select
        value={value}
        onChange={(event) => onChange((numeric ? Number(event.target.value) : event.target.value) as T)}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          height: 32,
          width,
          padding: '0 30px 0 10px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--glass-fill)',
          border: '1px solid var(--glass-border-subtle)',
          color: 'var(--text-primary)',
          fontSize: '0.8125rem',
          fontFamily: 'var(--font-text)',
          outline: 'none',
          cursor: 'pointer',
          ...style,
        }}
        {...props}
      >
        {options.map((option) => (
          <option key={String(option.value)} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: 9,
          color: 'var(--text-tertiary)',
          pointerEvents: 'none',
        }}
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}
