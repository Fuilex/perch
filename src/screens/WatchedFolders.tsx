import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/store/app';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Glass } from '@/components/Glass';
import { IconButton } from '@/components/IconButton';
import { Toggle } from '@/components/Toggle';
import { listContainer, listItem } from '@/design/animations';
import * as ipc from '@/lib/ipc';
import { basename, parentOf } from '@/lib/format';
import { useT } from '@/lib/i18n';
import type { WatchedFolder } from '@/lib/ipc';

export function WatchedFoldersScreen() {
  const t = useT();
  const folders = useApp((s) => s.folders);
  const addFolder = useApp((s) => s.addFolder);
  const autoOrganize = useApp((s) => s.config?.auto_organize ?? false);

  if (folders.length === 0) {
    return (
      <EmptyState
        icon={
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
          </svg>
        }
        title={t('folders.emptyTitle')}
        description={t('folders.emptyBody')}
        action={
          <Button variant="primary" onClick={() => void addFolder()}>
            {t('folders.addOne')}
          </Button>
        }
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
          <h1 className="text-title">{t('folders.title')}</h1>
          <p className="text-secondary" style={{ fontSize: '0.8125rem', marginTop: 2 }}>
            {autoOrganize ? t('folders.autoOn') : t('folders.autoOff')}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => void addFolder()}>
          {t('folders.add')}
        </Button>
      </header>

      <motion.div
        variants={listContainer}
        initial="hidden"
        animate="visible"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        {folders.map((folder) => (
          <motion.div key={folder.id} variants={listItem}>
            <FolderCard folder={folder} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function FolderCard({ folder }: { folder: WatchedFolder }) {
  const t = useT();
  const toggleFolder = useApp((s) => s.toggleFolder);
  const setRecursive = useApp((s) => s.setFolderRecursive);
  const removeFolder = useApp((s) => s.removeFolder);
  const organize = useApp((s) => s.organize);
  const fail = useApp((s) => s.fail);
  const busy = useApp((s) => s.busy);

  const [count, setCount] = useState<number | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  // Counting means walking the tree, so it happens once per card and whenever
  // the recursive switch changes what "inside" means.
  useEffect(() => {
    let cancelled = false;
    setCount(null);
    ipc
      .scanFolder(folder.path)
      .then((files) => {
        if (!cancelled) setCount(files.length);
      })
      .catch(() => {
        if (!cancelled) setCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, [folder.path, folder.recursive]);

  return (
    <Glass variant="card" radius="var(--radius-lg)" padding="var(--space-4)">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="text-body text-truncate" style={{ fontWeight: 500 }} title={folder.path}>
            {basename(folder.path) || folder.path}
          </div>
          <div
            className="text-mono text-truncate"
            style={{ fontSize: '0.6875rem', marginTop: 2, color: 'var(--text-tertiary)' }}
            title={folder.path}
          >
            {parentOf(folder.path) || folder.path}
          </div>
        </div>

        <Toggle
          checked={folder.enabled}
          onChange={() => void toggleFolder(folder.id)}
          id={`folder-${folder.id}`}
          ariaLabel={t('folders.watch', { name: basename(folder.path) })}
        />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'var(--space-4)',
          gap: 'var(--space-2)',
        }}
      >
        <span className="text-caption tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
          {count === null ? t('folders.counting') : t('folders.files', { count })}
        </span>

        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
          }}
        >
          <input
            type="checkbox"
            checked={folder.recursive}
            onChange={(event) => void setRecursive(folder.id, event.target.checked)}
            style={{ accentColor: 'var(--accent)', width: 13, height: 13 }}
          />
          {t('folders.subfolders')}
        </label>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          marginTop: 'var(--space-3)',
          paddingTop: 'var(--space-3)',
          borderTop: '1px solid var(--glass-separator)',
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          loading={busy}
          onClick={() => void organize(folder.path)}
        >
          {t('folders.organize')}
        </Button>

        <IconButton
          label={t('common.showInFolder')}
          onClick={() => {
            ipc.revealPath(folder.path).catch(fail);
          }}
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6" />
              <path d="M10 14 21 3" />
              <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
            </svg>
          }
        />

        <div style={{ flex: 1 }} />

        {confirmingRemove ? (
          <Button variant="destructive" size="sm" onClick={() => void removeFolder(folder.id)}>
            {t('common.confirmRemove')}
          </Button>
        ) : (
          <IconButton
            label={t('folders.stopWatching')}
            onClick={() => setConfirmingRemove(true)}
            icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            }
          />
        )}
      </div>
    </Glass>
  );
}
