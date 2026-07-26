import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/store/app';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Sheet } from '@/components/Sheet';
import { Stepper } from '@/components/Stepper';
import { Toggle } from '@/components/Toggle';
import * as ipc from '@/lib/ipc';
import type { ActionKind, Condition, ConditionKind, Rule } from '@/lib/ipc';
import { TEMPLATE_VARIABLES, basename, conditionLabel, templateOf } from '@/lib/format';
import { useT, type Translate } from '@/lib/i18n';
import {
  AGE_UNITS,
  SIZE_UNITS,
  changeActionKind,
  newCondition,
  ruleProblem,
  splitAge,
  splitSize,
  toBytes,
  toSeconds,
  withTemplate,
  type AgeUnit,
  type SizeUnit,
} from '@/lib/rule';

const ACTION_KINDS: ActionKind[] = ['Move', 'Copy', 'Rename', 'Trash'];

const CONDITION_ORDER: ConditionKind[] = [
  'Extension',
  'Glob',
  'Regex',
  'SizeGreater',
  'SizeSmaller',
  'OlderThan',
  'NewerThan',
  'MimeType',
  'Duplicate',
  'MaxDepth',
];

export function RuleEditor() {
  const t = useT();
  const editingRule = useApp((s) => s.editingRule);
  const rules = useApp((s) => s.rules);
  const folders = useApp((s) => s.folders);
  const setEditingRule = useApp((s) => s.setEditingRule);
  const saveRule = useApp((s) => s.saveRule);
  const deleteRule = useApp((s) => s.deleteRule);

  const [draft, setDraft] = useState<Rule | null>(editingRule);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Re-seed whenever a different rule is opened. The previous version captured
  // the first rule it ever saw, so opening a second one showed the first.
  useEffect(() => {
    setDraft(editingRule);
    setConfirmingDelete(false);
  }, [editingRule]);

  const isExisting = useMemo(
    () => Boolean(editingRule && rules.some((r) => r.id === editingRule.id)),
    [editingRule, rules],
  );

  const close = useCallback(() => setEditingRule(null), [setEditingRule]);

  if (!editingRule || !draft) return null;

  const update = (patch: Partial<Rule>) => setDraft({ ...draft, ...patch });
  const problem = ruleProblem(draft);

  const setCondition = (index: number, condition: Condition) =>
    update({ conditions: draft.conditions.map((c, i) => (i === index ? condition : c)) });

  const template = templateOf(draft.action);

  return (
    <Sheet
      open
      onClose={close}
      title={isExisting ? t('editor.editTitle') : t('editor.newTitle')}
      subtitle={t('editor.subtitle')}
      footer={
        <>
          {isExisting &&
            (confirmingDelete ? (
              <Button variant="destructive" onClick={() => void deleteRule(draft.id)}>
                {t('common.confirmDelete')}
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setConfirmingDelete(true)}>
                {t('common.delete')}
              </Button>
            ))}
          <div style={{ flex: 1 }} />
          {problem && (
            <span className="text-secondary" style={{ fontSize: '0.75rem' }}>
              {t(problem)}
            </span>
          )}
          <Button variant="ghost" onClick={close}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" disabled={Boolean(problem)} onClick={() => void saveRule(draft)}>
            {isExisting ? t('common.save') : t('editor.create')}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <Input
          label={t('editor.name')}
          value={draft.name}
          onChange={(event) => update({ name: event.target.value })}
          placeholder={t('editor.namePlaceholder')}
          autoFocus
        />

        {/* ---------------------------------------------------------------- */}
        {/* Conditions */}
        {/* ---------------------------------------------------------------- */}

        <section>
          <SectionLabel>{t('editor.when')}</SectionLabel>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <AnimatePresence initial={false}>
              {draft.conditions.map((condition, index) => (
                <motion.div
                  key={`${condition.type}-${index}`}
                  layout
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                >
                  <Select
                    aria-label={t('editor.conditionType')}
                    value={condition.type}
                    width={168}
                    options={CONDITION_ORDER.filter(
                      (kind) =>
                        kind === condition.type ||
                        (!ipc.UNIMPLEMENTED_CONDITIONS.includes(kind) &&
                          !draft.conditions.some((c) => c.type === kind)),
                    ).map((kind) => ({ value: kind, label: conditionLabel(kind, t) }))}
                    onChange={(kind) => setCondition(index, newCondition(kind as ConditionKind))}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <ConditionValue
                      condition={condition}
                      onChange={(next) => setCondition(index, next)}
                      t={t}
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t('editor.removeCondition')}
                    onClick={() =>
                      update({ conditions: draft.conditions.filter((_, i) => i !== index) })
                    }
                    style={{ width: 32, padding: 0, flexShrink: 0 }}
                  >
                    ✕
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <AddCondition
            used={draft.conditions.map((c) => c.type)}
            onAdd={(kind) => update({ conditions: [...draft.conditions, newCondition(kind)] })}
            t={t}
          />

          {draft.conditions.length === 0 && (
            <p className="text-secondary" style={{ fontSize: '0.75rem', marginTop: 'var(--space-2)' }}>
              {t('editor.noConditions')}
            </p>
          )}
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Action */}
        {/* ---------------------------------------------------------------- */}

        <section>
          <SectionLabel>{t('editor.then')}</SectionLabel>

          <SegmentedControl
            ariaLabel={t('editor.then')}
            value={ACTION_KINDS.includes(draft.action.type) ? draft.action.type : 'Move'}
            segments={ACTION_KINDS.map((kind) => ({ value: kind, label: t(`action.${kind}`) }))}
            onChange={(kind) => update({ action: changeActionKind(draft.action, kind) })}
            fill
          />

          {ipc.UNIMPLEMENTED_ACTIONS.includes(draft.action.type) && (
            <Notice>{t('editor.notImplemented', { action: t(`action.${draft.action.type}`) })}</Notice>
          )}

          {template !== null && (
            <div style={{ marginTop: 'var(--space-3)' }}>
              <TemplateField
                kind={draft.action.type}
                value={template}
                onChange={(next) => update({ action: withTemplate(draft.action, next) })}
                t={t}
              />
            </div>
          )}

          {draft.action.type === 'Trash' && (
            <p className="text-secondary" style={{ fontSize: '0.75rem', marginTop: 'var(--space-2)' }}>
              {t('editor.trashNote')}
            </p>
          )}
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Options and preview */}
        {/* ---------------------------------------------------------------- */}

        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <SectionLabel>{t('editor.options')}</SectionLabel>
          <Toggle
            checked={draft.enabled}
            onChange={(enabled) => update({ enabled })}
            label={t('editor.active')}
            id="rule-enabled"
          />
          <Toggle
            checked={draft.stop_on_match}
            onChange={(stop_on_match) => update({ stop_on_match })}
            label={t('editor.stopOnMatch')}
            id="rule-stop"
          />
        </section>

        <MatchPreview rule={draft} hasFolders={folders.length > 0} t={t} />
      </div>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-caption"
      style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)' }}
    >
      {children}
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-secondary"
      style={{
        fontSize: '0.75rem',
        marginTop: 'var(--space-2)',
        padding: 'var(--space-2) var(--space-3)',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'var(--glass-fill)',
        border: '1px solid var(--glass-border-subtle)',
      }}
    >
      {children}
    </p>
  );
}

/** The value side of a condition row — shaped to the condition's kind. */
function ConditionValue({
  condition,
  onChange,
  t,
}: {
  condition: Condition;
  onChange: (next: Condition) => void;
  t: Translate;
}) {
  switch (condition.type) {
    case 'Extension':
    case 'Glob':
    case 'Regex':
    case 'MimeType': {
      const placeholder =
        condition.type === 'Extension'
          ? 'pdf'
          : condition.type === 'Glob'
            ? 'Screenshot*.png'
            : condition.type === 'Regex'
              ? '^invoice-\\d+'
              : 'image/png';
      return (
        <Input
          value={condition.value}
          onChange={(event) => onChange({ ...condition, value: event.target.value })}
          placeholder={placeholder}
          aria-label={conditionLabel(condition.type, t)}
        />
      );
    }

    case 'SizeGreater':
    case 'SizeSmaller': {
      const { amount, unit } = splitSize(condition.value);
      return (
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <Stepper
            ariaLabel={t('cond.SizeGreater')}
            value={amount}
            min={1}
            onChange={(next) => onChange({ ...condition, value: toBytes(next, unit) })}
          />
          <Select
            aria-label={t('cond.SizeGreater')}
            value={unit}
            options={SIZE_UNITS.map((u) => ({ value: u.label, label: t(`unit.${u.label}`) }))}
            onChange={(next) => onChange({ ...condition, value: toBytes(amount, next as SizeUnit) })}
          />
        </div>
      );
    }

    case 'OlderThan':
    case 'NewerThan': {
      const { amount, unit } = splitAge(condition.value);
      return (
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <Stepper
            ariaLabel={t('cond.OlderThan')}
            value={amount}
            min={1}
            onChange={(next) => onChange({ ...condition, value: toSeconds(next, unit) })}
          />
          <Select
            aria-label={t('cond.OlderThan')}
            value={unit}
            options={AGE_UNITS.map((u) => ({ value: u.label, label: t(`unit.${u.label}`) }))}
            onChange={(next) => onChange({ ...condition, value: toSeconds(amount, next as AgeUnit) })}
          />
        </div>
      );
    }

    case 'MaxDepth':
      return (
        <Stepper
          ariaLabel={t('cond.MaxDepth')}
          value={condition.value}
          min={0}
          max={32}
          suffix={t('unit.deep')}
          onChange={(value) => onChange({ ...condition, value })}
        />
      );

    case 'Duplicate':
      return (
        <span className="text-secondary" style={{ fontSize: '0.8125rem' }}>
          {t('editor.noValueNeeded')}
        </span>
      );
  }
}

function AddCondition({
  used,
  onAdd,
  t,
}: {
  used: ConditionKind[];
  onAdd: (kind: ConditionKind) => void;
  t: Translate;
}) {
  const available = CONDITION_ORDER.filter(
    (kind) => !used.includes(kind) && !ipc.UNIMPLEMENTED_CONDITIONS.includes(kind),
  );

  if (available.length === 0) return null;

  return (
    <div
      style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', marginTop: 'var(--space-2)' }}
    >
      {available.map((kind) => (
        <Button key={kind} variant="secondary" size="sm" onClick={() => onAdd(kind)}>
          + {conditionLabel(kind, t)}
        </Button>
      ))}
    </div>
  );
}

/**
 * Destination or name template, with the variables the backend understands one
 * click away and validation from the same code that will run it.
 */
function TemplateField({
  kind,
  value,
  onChange,
  t,
}: {
  kind: ActionKind;
  value: string;
  onChange: (next: string) => void;
  t: Translate;
}) {
  const [unknown, setUnknown] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      ipc
        .validateTemplate(value)
        .then((result) => {
          if (!cancelled) setUnknown(result);
        })
        .catch(() => {
          if (!cancelled) setUnknown([]);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <Input
        label={kind === 'Rename' ? t('editor.newName') : t('editor.destination')}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={kind === 'Rename' ? '{year}-{month}-{name}.{ext}' : '~/Documents/{year}/{month}'}
        error={
          unknown.length > 0
            ? t(unknown.length > 1 ? 'editor.unknownVariables' : 'editor.unknownVariable', {
                list: unknown.join(', '),
              })
            : undefined
        }
        hint={kind === 'Rename' ? undefined : t('editor.destinationHint')}
        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {TEMPLATE_VARIABLES.map((variable) => (
          <button
            key={variable}
            onClick={() => onChange(value + variable)}
            title={t('editor.insert', { variable })}
            className="text-mono token"
            style={{
              fontSize: '0.6875rem',
              padding: '3px 7px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--glass-fill)',
              border: '1px solid var(--glass-border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            {variable}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Counts what the rule would touch right now by asking the backend to plan it
 * against the watched folders. Nothing is written — `preview_rule` only plans.
 */
function MatchPreview({ rule, hasFolders, t }: { rule: Rule; hasFolders: boolean; t: Translate }) {
  const [state, setState] = useState<{ loading: boolean; matches: string[]; error: string | null }>({
    loading: false,
    matches: [],
    error: null,
  });

  // Serialised so the effect re-runs on any meaningful edit, but not on renames.
  const signature = JSON.stringify({ conditions: rule.conditions, action: rule.action });

  useEffect(() => {
    if (!hasFolders) return;

    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));

    const timer = setTimeout(() => {
      ipc
        .previewRule(rule)
        .then((operations) => {
          if (cancelled) return;
          setState({ loading: false, matches: operations.map((op) => op.source), error: null });
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          setState({
            loading: false,
            matches: [],
            error: error instanceof Error ? error.message : String(error),
          });
        });
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // The rule is intentionally read through `signature` — see above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, hasFolders]);

  if (!hasFolders) {
    return <Notice>{t('editor.addFolderFirst')}</Notice>;
  }

  const { loading, matches, error } = state;

  return (
    <section
      style={{
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--glass-fill)',
        border: '1px solid var(--glass-border-subtle)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
        }}
      >
        <span className="text-body" style={{ fontSize: '0.8125rem' }}>
          {error
            ? t('editor.previewFailed')
            : loading
              ? t('editor.checking')
              : t('editor.matches', { count: matches.length })}
        </span>
        {loading && (
          <span
            style={{
              width: 12,
              height: 12,
              border: '2px solid var(--text-tertiary)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
            }}
          />
        )}
      </div>

      {error && (
        <div className="text-secondary" style={{ fontSize: '0.75rem', marginTop: 4 }}>
          {error}
        </div>
      )}

      {!error && matches.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            marginTop: 'var(--space-2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {matches.slice(0, 4).map((path) => (
            <li
              key={path}
              className="text-mono text-truncate"
              style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}
            >
              {basename(path)}
            </li>
          ))}
          {matches.length > 4 && (
            <li className="text-secondary" style={{ fontSize: '0.6875rem' }}>
              {t('editor.andMore', { count: matches.length - 4 })}
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
