import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, icon, id, style, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {label && (
          <label htmlFor={inputId} className="text-secondary" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
            {label}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {icon && (
            <span style={{ position: 'absolute', left: 12, color: 'var(--text-tertiary)', display: 'flex' }}>
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            style={{
              width: '100%',
              height: 36,
              padding: icon ? '0 12px 0 36px' : '0 12px',
              backgroundColor: 'var(--glass-fill)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-text)',
              outline: 'none',
              transition: 'border-color 150ms ease, box-shadow 150ms ease',
              ...style,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--glass-highlight)';
              e.currentTarget.style.boxShadow = 'var(--focus-ring)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--glass-border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            {...props}
          />
        </div>
        {(hint || error) && (
          <span style={{ fontSize: '0.75rem', color: error ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: error ? 500 : 400 }}>
            {error ?? hint}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';
