import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Glass } from './Glass';
import { listItem } from '@/design/animations';

interface SettingGroupProps {
  title: string;
  children: ReactNode;
  /** Trailing element in the group header — a button, a status chip. */
  aside?: ReactNode;
}

/**
 * A titled card holding a stack of settings rows. Groups animate in one after
 * another — the parent supplies the stagger through a `listContainer` variant.
 */
export function SettingGroup({ title, children, aside }: SettingGroupProps) {
  return (
    <motion.section variants={listItem}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--space-1) var(--space-2)',
        }}
      >
        <h2 className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
          {title}
        </h2>
        {aside}
      </div>
      <Glass variant="card" padding="0" radius="var(--radius-lg)">
        {children}
      </Glass>
    </motion.section>
  );
}

interface SettingRowProps {
  label: string;
  description?: string;
  children?: ReactNode;
  /** Puts the control on its own line — for wide controls like path fields. */
  stacked?: boolean;
  /** Dims the row and blocks the control when the setting can't apply. */
  disabled?: boolean;
}

/**
 * One setting: name and explanation on the left, control on the right.
 * Rows draw their own top separator so a group needs no extra markup.
 */
export function SettingRow({ label, description, children, stacked, disabled }: SettingRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: stacked ? 'column' : 'row',
        alignItems: stacked ? 'stretch' : 'center',
        justifyContent: 'space-between',
        gap: stacked ? 'var(--space-3)' : 'var(--space-6)',
        padding: 'var(--space-3) var(--space-4)',
        opacity: disabled ? 0.45 : 1,
        pointerEvents: disabled ? 'none' : undefined,
      }}
      className="setting-row"
    >
      <div style={{ minWidth: 0 }}>
        <div className="text-body">{label}</div>
        {description && (
          <div
            className="text-secondary"
            style={{ fontSize: '0.75rem', marginTop: 2, maxWidth: '44ch' }}
          >
            {description}
          </div>
        )}
      </div>
      {children && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {children}
        </div>
      )}
    </div>
  );
}
