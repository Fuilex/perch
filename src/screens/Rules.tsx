import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useState } from 'react';
import { useRulesStore } from '@/store/rules';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Toggle } from '@/components/Toggle';
import { EmptyState } from '@/components/EmptyState';
import { listContainer, listItem } from '@/design/animations';
import { springs } from '@/design/tokens';

export function RulesScreen() {
  const { rules, toggleRule, setEditingRule, deleteRule } = useRulesStore();
  const [items, setItems] = useState(rules);

  // Sync with store
  const displayRules = rules.length > 0 ? rules : items;

  if (displayRules.length === 0) {
    return (
      <EmptyState
        icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>}
        title="No rules yet"
        description="Create your first rule to start organizing files automatically."
        action={
          <Button variant="primary" onClick={() => setEditingRule({
            id: crypto.randomUUID(), name: '', enabled: true,
            conditions: [], action: { type: 'Move', dest_template: '' },
            stop_on_match: true, order: 0,
          })}>
            Create Rule
          </Button>
        }
      />
    );
  }

  return (
    <div style={{ padding: 'var(--space-6) 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h1 className="text-title">Rules</h1>
        <Button variant="primary" size="sm" onClick={() => setEditingRule({
          id: crypto.randomUUID(), name: '', enabled: true,
          conditions: [], action: { type: 'Move', dest_template: '' },
          stop_on_match: true, order: displayRules.length,
        })}>
          New Rule
        </Button>
      </div>

      <motion.div
        variants={listContainer}
        initial="hidden"
        animate="visible"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}
      >
        <AnimatePresence>
          {displayRules.map((rule) => (
            <motion.div key={rule.id} variants={listItem} layout transition={springs.default}>
              <Card onClick={() => setEditingRule(rule)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    {/* Drag handle */}
                    <span style={{ color: 'var(--text-quaternary)', cursor: 'grab', display: 'flex' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
                    </span>
                    <div>
                      <div className="text-body" style={{ fontWeight: 500 }}>{rule.name || 'Untitled Rule'}</div>
                      <div className="text-secondary" style={{ fontSize: '0.75rem', marginTop: 2 }}>
                        {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''} → {rule.action.type}
                        {rule.stop_on_match && ' · stops'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }} onClick={(e) => e.stopPropagation()}>
                    <Toggle checked={rule.enabled} onChange={() => toggleRule(rule.id)} />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
