import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { commandPaletteOverlay, commandPaletteContent } from '@/design/animations';
import { Glass } from './Glass';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  action: () => void;
  icon?: React.ReactNode;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  items: CommandItem[];
}

export function CommandPalette({ open, onClose, items }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = items.filter(
    (item) =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.description?.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      } else if (e.key === 'Enter' && filtered[selected]) {
        filtered[selected].action();
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [filtered, selected, onClose],
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 500 }}
            variants={commandPaletteOverlay}
            initial="hidden" animate="visible" exit="exit"
            onClick={onClose}
          />
          <motion.div
            className="fixed"
            style={{ top: '15%', left: '50%', width: 520, x: '-50%', zIndex: 501 }}
            variants={commandPaletteContent}
            initial="hidden" animate="visible" exit="exit"
          >
            <Glass variant="popover" padding="0" radius="var(--radius-xl)">
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--glass-separator)' }}>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a command..."
                  style={{
                    width: '100%', background: 'none', border: 'none', outline: 'none',
                    color: 'var(--text-primary)', fontSize: '0.9375rem', fontFamily: 'var(--font-text)',
                  }}
                />
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto', padding: 6 }}>
                {filtered.map((item, i) => (
                  <button
                    key={item.id}
                    onClick={() => { item.action(); onClose(); }}
                    onMouseEnter={() => setSelected(i)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 'var(--radius-sm)', textAlign: 'left',
                      backgroundColor: i === selected ? 'var(--glass-fill-hover)' : 'transparent',
                      color: 'var(--text-primary)', fontSize: '0.875rem',
                      transition: 'background-color 80ms ease',
                    }}
                  >
                    {item.icon && <span style={{ color: 'var(--text-tertiary)', display: 'flex' }}>{item.icon}</span>}
                    <div>
                      <div>{item.label}</div>
                      {item.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{item.description}</div>}
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
                    No results
                  </div>
                )}
              </div>
            </Glass>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
