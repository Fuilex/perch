import { useState } from 'react';
import { useRulesStore } from '@/store/rules';
import { Sheet } from '@/components/Sheet';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Toggle } from '@/components/Toggle';
import { Chip } from '@/components/Chip';

const CONDITION_TYPES = ['Extension', 'Glob', 'Regex', 'SizeGreater', 'SizeSmaller', 'OlderThan', 'NewerThan', 'MimeType', 'Duplicate', 'MaxDepth'];
const ACTION_TYPES = ['Move', 'Copy', 'Rename', 'Trash', 'Unzip', 'RunCommand'];

export function RuleEditor() {
  const { editingRule, setEditingRule, addRule, updateRule, rules } = useRulesStore();
  const [rule, setRule] = useState(editingRule);
  const isNew = !rules.find((r) => r.id === editingRule?.id);

  if (!editingRule || !rule) return null;

  const update = (patch: Partial<typeof rule>) => setRule({ ...rule, ...patch });

  const handleSave = () => {
    if (isNew) addRule(rule);
    else updateRule(rule);
    setEditingRule(null);
  };

  const addCondition = (type: string) => {
    const value = type === 'Duplicate' ? undefined : '';
    update({ conditions: [...rule.conditions, { type, value }] });
  };

  const removeCondition = (i: number) => {
    update({ conditions: rule.conditions.filter((_, idx) => idx !== i) });
  };

  const updateConditionValue = (i: number, value: string) => {
    const conds = [...rule.conditions];
    conds[i] = { ...conds[i]!, value };
    update({ conditions: conds });
  };

  return (
    <Sheet open={!!editingRule} onClose={() => setEditingRule(null)} title={isNew ? 'New Rule' : 'Edit Rule'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Input label="Name" value={rule.name} onChange={(e) => update({ name: e.target.value })} placeholder="e.g., PDF Organizer" />

        {/* Conditions */}
        <div>
          <div className="text-caption" style={{ marginBottom: 'var(--space-2)' }}>IF</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {rule.conditions.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Chip label={c.type} onRemove={() => removeCondition(i)} />
                {c.type !== 'Duplicate' && (
                  <Input
                    value={String(c.value ?? '')}
                    onChange={(e) => updateConditionValue(i, e.target.value)}
                    placeholder={c.type === 'Extension' ? 'pdf' : c.type === 'Glob' ? '*.pdf' : 'value'}
                    style={{ flex: 1 }}
                  />
                )}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', marginTop: 'var(--space-2)' }}>
            {CONDITION_TYPES.filter((t) => !rule.conditions.find((c) => c.type === t)).map((t) => (
              <Button key={t} variant="ghost" size="sm" onClick={() => addCondition(t)}>{t}</Button>
            ))}
          </div>
        </div>

        {/* Action */}
        <div>
          <div className="text-caption" style={{ marginBottom: 'var(--space-2)' }}>THEN</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
            {ACTION_TYPES.map((t) => (
              <Button
                key={t}
                variant={rule.action.type === t ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => update({ action: { ...rule.action, type: t } })}
              >
                {t}
              </Button>
            ))}
          </div>
          {['Move', 'Copy', 'Unzip'].includes(rule.action.type) && (
            <Input
              label="Destination template"
              value={rule.action.dest_template ?? ''}
              onChange={(e) => update({ action: { ...rule.action, dest_template: e.target.value } })}
              placeholder="~/Documents/{year}/{name}.{ext}"
            />
          )}
          {rule.action.type === 'Rename' && (
            <Input
              label="Name template"
              value={rule.action.template ?? ''}
              onChange={(e) => update({ action: { ...rule.action, template: e.target.value } })}
              placeholder="{name}_{counter}.{ext}"
            />
          )}
        </div>

        <Toggle checked={rule.stop_on_match} onChange={(v) => update({ stop_on_match: v })} label="Stop on match" />

        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
          <Button variant="ghost" onClick={() => setEditingRule(null)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Rule</Button>
        </div>
      </div>
    </Sheet>
  );
}
