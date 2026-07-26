import { useMemo, useState } from 'react';
import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion';
import { useApp } from '@/store/app';
import { Button } from '@/components/Button';
import { Glass } from '@/components/Glass';
import { IconButton } from '@/components/IconButton';
import { PresetGrid } from '@/components/PresetGrid';
import { Toggle } from '@/components/Toggle';
import { Input } from '@/components/Input';
import { describeRule } from '@/lib/format';
import { useT } from '@/lib/i18n';
import { newRule } from '@/lib/rule';
import { springs } from '@/design/tokens';
import type { Rule } from '@/lib/ipc';

export function RulesScreen() {
  const t = useT();
  const rules = useApp((s) => s.rules);
  const stats = useApp((s) => s.stats);
  const busy = useApp((s) => s.busy);
  const setEditingRule = useApp((s) => s.setEditingRule);
  const reorderRules = useApp((s) => s.reorderRules);
  const organize = useApp((s) => s.organize);
  const [query, setQuery] = useState('');

  // Searching filters the list, and a filtered list must not be draggable —
  // reordering a subset would write an order the user never saw.
  const needle = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      needle === ''
        ? rules
        : rules.filter((rule) =>
            [rule.name, describeRule(rule, t)].join(' ').toLowerCase().includes(needle),
          ),
    [needle, rules, t],
  );

  // Reorder.Group works on a list of keys; the rules themselves stay in store
  // order so a save landing mid-drag can't duplicate a card.
  const ids = useMemo(() => visible.map((r) => r.id), [visible]);
  const byId = useMemo(() => new Map(rules.map((r) => [r.id, r])), [rules]);

  if (rules.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-8) 0',
          textAlign: 'center',
        }}
      >
        <h1 className="text-title">{t('rules.emptyTitle')}</h1>
        <p className="text-secondary" style={{ maxWidth: 420, fontSize: '0.8125rem' }}>
          {t('rules.emptyBody')}
        </p>

        {/* Presets first: a blank editor is the hardest place to start from. */}
        <div style={{ width: '100%', maxWidth: 560, marginTop: 'var(--space-4)' }}>
          <div
            className="text-caption"
            style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)' }}
          >
            {t('preset.title')}
          </div>
          <PresetGrid />
          <p
            className="text-secondary"
            style={{ fontSize: '0.6875rem', marginTop: 'var(--space-2)' }}
          >
            {t('preset.hint')}
          </p>
        </div>

        <Button
          variant="ghost"
          onClick={() => setEditingRule(newRule(0))}
          style={{ marginTop: 'var(--space-2)' }}
        >
          {t('rules.create')}
        </Button>
      </motion.div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-6) 0' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 'var(--space-5)',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <h1 className="text-title">{t('rules.title')}</h1>
          <p className="text-secondary" style={{ fontSize: '0.8125rem', marginTop: 2 }}>
            {t('rules.subtitle')}
            {stats ? ` · ${t('rules.filesWatched', { count: stats.watched_files })}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0, alignItems: 'center' }}>
          {rules.length > 3 && (
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('rules.search')}
              aria-label={t('rules.search')}
              style={{ width: 190, height: 32 }}
            />
          )}
          <Button variant="secondary" size="sm" loading={busy} onClick={() => void organize()}>
            {t('common.organizeNow')}
          </Button>
          <Button variant="primary" size="sm" onClick={() => setEditingRule(newRule(rules.length))}>
            {t('rules.new')}
          </Button>
        </div>
      </header>

      <Reorder.Group
        axis="y"
        values={ids}
        onReorder={(next) => void reorderRules(next as string[])}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', listStyle: 'none' }}
      >
        <AnimatePresence initial={false}>
          {ids.map((id) => {
            const rule = byId.get(id);
            return rule ? <RuleCard key={id} rule={rule} draggable={needle === ''} /> : null;
          })}
        </AnimatePresence>
      </Reorder.Group>

      {ids.length === 0 && (
        <p
          className="text-secondary"
          style={{ fontSize: '0.8125rem', textAlign: 'center', padding: 'var(--space-8) 0' }}
        >
          {t('rules.noMatches')}
        </p>
      )}
    </div>
  );
}

function RuleCard({ rule, draggable }: { rule: Rule; draggable: boolean }) {
  const t = useT();
  const organizeRule = useApp((s) => s.organizeRule);
  const setEditingRule = useApp((s) => s.setEditingRule);
  const toggleRule = useApp((s) => s.toggleRule);
  const duplicateRule = useApp((s) => s.duplicateRule);
  const deleteRule = useApp((s) => s.deleteRule);
  const [hovered, setHovered] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Dragging is restricted to the grip: the whole card is a click target for
  // opening the editor, and the two gestures would fight over it otherwise.
  const dragControls = useDragControls();
  const summary = describeRule(rule, t);

  return (
    <Reorder.Item
      value={rule.id}
      drag={draggable ? 'y' : false}
      dragListener={false}
      dragControls={dragControls}
      layout
      transition={springs.default}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      whileDrag={{ scale: 1.01, zIndex: 10, boxShadow: 'var(--shadow-lg)' }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => {
        setHovered(false);
        setConfirmingDelete(false);
      }}
      style={{ listStyle: 'none', position: 'relative' }}
    >
      <Glass
        variant="card"
        interactive
        radius="var(--radius-lg)"
        padding="var(--space-3) var(--space-4)"
        onClick={() => setEditingRule(rule)}
        role="button"
        tabIndex={0}
        onKeyDown={(event: React.KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setEditingRule(rule);
          }
        }}
        style={{ cursor: 'pointer', opacity: rule.enabled ? 1 : 0.55 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span
            aria-hidden="true"
            onPointerDown={(event) => {
              event.stopPropagation();
              if (draggable) dragControls.start(event);
            }}
            onClick={(event) => event.stopPropagation()}
            style={{
              color: hovered ? 'var(--text-tertiary)' : 'var(--text-quaternary)',
              cursor: draggable ? 'grab' : 'default',
              opacity: draggable ? 1 : 0.4,
              display: 'flex',
              flexShrink: 0,
              touchAction: 'none',
              transition: 'color 150ms ease',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="6" r="1.5" />
              <circle cx="15" cy="6" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="18" r="1.5" />
              <circle cx="15" cy="18" r="1.5" />
            </svg>
          </span>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="text-body text-truncate" style={{ fontWeight: 500 }}>
              {rule.name || t('rules.untitled')}
            </div>
            <div
              className="text-secondary text-truncate"
              style={{ fontSize: '0.75rem', marginTop: 2 }}
              title={summary}
            >
              {summary}
              {rule.stop_on_match && rule.conditions.length > 0 && ` · ${t('rules.stopsHere')}`}
            </div>
          </div>

          <div
            onClick={(event) => event.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', flexShrink: 0 }}
          >
            <motion.div
              animate={{ opacity: hovered ? 1 : 0 }}
              transition={{ duration: 0.12 }}
              style={{ display: 'flex', gap: 2, pointerEvents: hovered ? 'auto' : 'none' }}
            >
              <IconButton
                label={t('rules.runNow')}
                onClick={() => void organizeRule(rule)}
                icon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="6 4 20 12 6 20 6 4" />
                  </svg>
                }
              />
              <IconButton
                label={t('rules.duplicate')}
                onClick={() => void duplicateRule(rule.id)}
                icon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="12" height="12" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                }
              />
              {confirmingDelete ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => void deleteRule(rule.id)}
                  style={{ height: 28 }}
                >
                  {t('common.delete')}?
                </Button>
              ) : (
                <IconButton
                  label={t('rules.deleteRule')}
                  onClick={() => setConfirmingDelete(true)}
                  icon={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                  }
                />
              )}
            </motion.div>

            <Toggle
              checked={rule.enabled}
              onChange={() => void toggleRule(rule.id)}
              id={`rule-${rule.id}`}
              ariaLabel={t('rules.enable', { name: rule.name || t('rules.untitled') })}
            />
          </div>
        </div>
      </Glass>
    </Reorder.Item>
  );
}
