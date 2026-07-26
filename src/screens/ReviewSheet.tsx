import { useMemo } from 'react';
import { useApp } from '@/store/app';
import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import { basename, ellipsisPath } from '@/lib/format';
import { useT } from '@/lib/i18n';

/**
 * The dry run, shown before anything is touched, when "Review before applying"
 * is on. Deselecting a row leaves that file alone — the backend only executes
 * operations whose `selected` flag is set.
 */
export function ReviewSheet() {
  const t = useT();
  const review = useApp((s) => s.review);
  const busy = useApp((s) => s.reviewBusy);
  const closeReview = useApp((s) => s.closeReview);
  const toggleItem = useApp((s) => s.toggleReviewItem);
  const setAll = useApp((s) => s.setAllReviewItems);
  const apply = useApp((s) => s.applyReview);

  const selected = useMemo(() => review?.filter((op) => op.selected).length ?? 0, [review]);

  if (!review) return null;

  return (
    <Sheet
      open
      onClose={closeReview}
      title={t('review.title')}
      subtitle={t('review.subtitle', { count: review.length })}
      maxWidth={720}
      footer={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAll(selected !== review.length)}
          >
            {selected === review.length ? t('review.deselectAll') : t('review.selectAll')}
          </Button>
          <div style={{ flex: 1 }} />
          <Button variant="ghost" onClick={closeReview}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            loading={busy}
            disabled={selected === 0}
            onClick={() => void apply()}
          >
            {selected === review.length
              ? t('review.apply', { count: selected })
              : t('review.applySome', { count: selected, total: review.length })}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {review.map((op) => (
          <label
            key={op.id}
            className="setting-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-2) var(--space-1)',
              cursor: 'pointer',
              opacity: op.selected ? 1 : 0.45,
            }}
          >
            <input
              type="checkbox"
              checked={op.selected}
              onChange={() => toggleItem(op.id)}
              style={{ accentColor: 'var(--accent)', width: 14, height: 14, flexShrink: 0 }}
            />

            <span
              className="text-caption"
              style={{ width: 52, flexShrink: 0, color: 'var(--text-tertiary)' }}
            >
              {t(`action.${op.action_type}`)}
            </span>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="text-body text-truncate" style={{ fontSize: '0.8125rem' }} title={op.source}>
                {basename(op.source)}
              </div>
              <div
                className="text-mono text-truncate"
                style={{ fontSize: '0.6875rem', marginTop: 2, color: 'var(--text-tertiary)' }}
                title={op.destination ?? undefined}
              >
                {op.rule_name}
                {op.destination ? ` → ${ellipsisPath(op.destination, 52)}` : ''}
              </div>
            </div>
          </label>
        ))}
      </div>
    </Sheet>
  );
}
