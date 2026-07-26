import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/store/app';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Glass } from '@/components/Glass';
import { IconButton } from '@/components/IconButton';
import { listContainer, listItem } from '@/design/animations';
import * as ipc from '@/lib/ipc';
import { useT } from '@/lib/i18n';
import { basename, ellipsisPath, relativeTime } from '@/lib/format';
import type { ActivityEntry } from '@/lib/ipc';

/** Entries as the backend recorded them, gathered into the batches they ran in. */
interface Batch {
  id: string;
  at: string;
  entries: ActivityEntry[];
  undoable: number;
}

function groupIntoBatches(entries: ActivityEntry[]): Batch[] {
  const batches = new Map<string, Batch>();

  for (const entry of entries) {
    const batch = batches.get(entry.batch_id);
    if (batch) {
      batch.entries.push(entry);
      if (!entry.undone) batch.undoable += 1;
      if (entry.timestamp > batch.at) batch.at = entry.timestamp;
    } else {
      batches.set(entry.batch_id, {
        id: entry.batch_id,
        at: entry.timestamp,
        entries: [entry],
        undoable: entry.undone ? 0 : 1,
      });
    }
  }

  return [...batches.values()].sort((a, b) => (a.at < b.at ? 1 : -1));
}

export function ActivityScreen() {
  const t = useT();
  const activity = useApp((s) => s.activity);
  const clearActivity = useApp((s) => s.clearActivity);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const batches = useMemo(() => groupIntoBatches(activity), [activity]);

  if (activity.length === 0) {
    return (
      <EmptyState
        icon={
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        }
        title={t('activity.emptyTitle')}
        description={t('activity.emptyBody')}
      />
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
          <h1 className="text-title">{t('activity.title')}</h1>
          <p className="text-secondary" style={{ fontSize: '0.8125rem', marginTop: 2 }}>
            {t('activity.count', { count: activity.length })}
          </p>
        </div>
        {confirmingClear ? (
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="ghost" size="sm" onClick={() => setConfirmingClear(false)}>
              {t('activity.keep')}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setConfirmingClear(false);
                void clearActivity();
              }}
            >
              {t('activity.clear')}
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setConfirmingClear(true)}>
            {t('activity.clear')}
          </Button>
        )}
      </header>

      {confirmingClear && (
        <p className="text-secondary" style={{ fontSize: '0.75rem', marginBottom: 'var(--space-3)' }}>
          {t('activity.clearWarning')}
        </p>
      )}

      <motion.div
        variants={listContainer}
        initial="hidden"
        animate="visible"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
      >
        {batches.map((batch) => (
          <motion.section key={batch.id} variants={listItem}>
            <BatchCard batch={batch} />
          </motion.section>
        ))}
      </motion.div>
    </div>
  );
}

function BatchCard({ batch }: { batch: Batch }) {
  const t = useT();
  const undoBatch = useApp((s) => s.undoBatch);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          padding: '0 var(--space-1) var(--space-2)',
        }}
      >
        <h2 className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
          {t('activity.batch', {
            time: relativeTime(batch.at, t),
            count: batch.entries.length,
          })}
        </h2>
        {batch.undoable > 1 && (
          <Button variant="ghost" size="sm" onClick={() => void undoBatch(batch.id)}>
            {t('activity.undoAll', { count: batch.undoable })}
          </Button>
        )}
      </div>

      <Glass variant="card" radius="var(--radius-lg)" padding="0">
        {batch.entries.map((entry) => (
          <EntryRow key={entry.id} entry={entry} />
        ))}
      </Glass>
    </div>
  );
}

function EntryRow({ entry }: { entry: ActivityEntry }) {
  const t = useT();
  const undo = useApp((s) => s.undo);
  const fail = useApp((s) => s.fail);
  const [hovered, setHovered] = useState(false);

  // Trashed files are restored from the OS recycle bin, not from here.
  const canUndo = !entry.undone && entry.action_type !== 'Trash';
  const target = entry.destination ?? entry.source;

  return (
    <div
      className="setting-row"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
      }}
    >
      <span
        className="text-caption"
        style={{
          flexShrink: 0,
          width: 52,
          color: 'var(--text-tertiary)',
        }}
      >
        {t(`action.${entry.action_type}`)}
      </span>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          className="text-body text-truncate"
          style={{
            opacity: entry.undone ? 0.5 : 1,
            textDecoration: entry.undone ? 'line-through' : 'none',
          }}
          title={entry.source}
        >
          {basename(entry.source)}
        </div>
        <div
          className="text-mono text-truncate"
          style={{ fontSize: '0.6875rem', marginTop: 2, color: 'var(--text-tertiary)' }}
          title={entry.destination ?? undefined}
        >
          {entry.rule_name}
          {entry.destination ? ` → ${ellipsisPath(entry.destination, 46)}` : ''}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <motion.div animate={{ opacity: hovered ? 1 : 0 }} transition={{ duration: 0.12 }}>
          <IconButton
            label={t('common.showInFolder')}
            onClick={() => {
              ipc.revealPath(target).catch(fail);
            }}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6" />
                <path d="M10 14 21 3" />
                <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
              </svg>
            }
          />
        </motion.div>

        {entry.undone ? (
          <span className="text-caption" style={{ color: 'var(--text-quaternary)' }}>
            {t('activity.undone')}
          </span>
        ) : canUndo ? (
          <Button variant="ghost" size="sm" onClick={() => void undo(entry.id)}>
            {t('common.undo')}
          </Button>
        ) : (
          <span
            className="text-caption"
            style={{ color: 'var(--text-quaternary)' }}
            title={t('activity.inTrashHint')}
          >
            {t('activity.inTrash')}
          </span>
        )}
      </div>
    </div>
  );
}
