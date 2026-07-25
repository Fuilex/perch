import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { motion } from 'framer-motion';
import { listContainer, listItem } from '@/design/animations';

export function WatchedFoldersScreen() {
  const folders: Array<{ id: string; path: string; enabled: boolean; fileCount: number }> = [];

  if (folders.length === 0) {
    return (
      <EmptyState
        icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>}
        title="No watched folders"
        description="Add a folder to start monitoring for changes."
        action={<Button variant="primary">Add Folder</Button>}
      />
    );
  }

  return (
    <div style={{ padding: 'var(--space-6) 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h1 className="text-title">Watched Folders</h1>
        <Button variant="primary" size="sm">Add Folder</Button>
      </div>
      <motion.div variants={listContainer} initial="hidden" animate="visible" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>
        {folders.map((f) => (
          <motion.div key={f.id} variants={listItem}>
            <Card>
              <div className="text-body" style={{ fontWeight: 500 }}>{f.path.split(/[/\\]/).pop()}</div>
              <div className="text-mono text-secondary" style={{ fontSize: '0.6875rem', marginTop: 4 }}>{f.path}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-3)' }}>
                <span className="text-caption tabular-nums">{f.fileCount} files</span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: f.enabled ? 'var(--text-primary)' : 'var(--text-quaternary)' }} />
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
