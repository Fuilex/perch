import { motion } from 'framer-motion';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { listContainer, listItem } from '@/design/animations';

interface ActivityEntry {
  id: string;
  batch_id: string;
  source: string;
  destination: string | null;
  action_type: string;
  timestamp: string;
  rule_name: string;
  undone: boolean;
}

// Mock data for display
const MOCK: ActivityEntry[] = [];

export function ActivityScreen() {
  const entries = MOCK;

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        title="No activity"
        description="File operations will appear here once rules are applied."
      />
    );
  }

  return (
    <div style={{ padding: 'var(--space-6) 0' }}>
      <h1 className="text-title" style={{ marginBottom: 'var(--space-6)' }}>Activity</h1>
      <motion.div variants={listContainer} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {entries.map((entry) => (
          <motion.div key={entry.id} variants={listItem}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="text-body" style={{ fontWeight: 500, opacity: entry.undone ? 0.5 : 1, textDecoration: entry.undone ? 'line-through' : 'none' }}>
                    {entry.action_type}: {entry.source.split('/').pop()}
                  </div>
                  <div className="text-secondary" style={{ fontSize: '0.75rem', marginTop: 2 }}>
                    {entry.rule_name} · {new Date(entry.timestamp).toLocaleString()}
                  </div>
                  {entry.destination && (
                    <div className="text-mono text-secondary" style={{ fontSize: '0.6875rem', marginTop: 4 }}>
                      → {entry.destination}
                    </div>
                  )}
                </div>
                {!entry.undone && (
                  <Button variant="ghost" size="sm">Undo</Button>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
