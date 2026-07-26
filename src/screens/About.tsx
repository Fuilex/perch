import { motion } from 'framer-motion';
import { useApp } from '@/store/app';
import * as ipc from '@/lib/ipc';
import { useT } from '@/lib/i18n';
import { Logo } from '@/components/Brand';
import { Button } from '@/components/Button';

/** The project page, opened in the system browser. */
const GITHUB_URL = 'https://github.com/Fuilex/perch';

export function AboutScreen() {
  const t = useT();
  const fail = useApp((s) => s.fail);
  const about = useApp((s) => s.about);
  const stats = useApp((s) => s.stats);

  const facts = stats
    ? [
        t('about.rules', { count: stats.rules }),
        t('about.folders', { count: stats.folders }),
        t('about.operations', { count: stats.operations }),
      ]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.24 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        textAlign: 'center',
        gap: 'var(--space-4)',
      }}
    >
      <Logo height={40} style={{ color: 'var(--text-primary)', opacity: 0.95 }} />

      <p className="text-body" style={{ color: 'var(--text-secondary)', maxWidth: 360 }}>
        {t('about.body')}
      </p>

      {facts.length > 0 && (
        <p className="text-secondary tabular-nums" style={{ fontSize: '0.75rem' }}>
          {facts.join(' · ')}
        </p>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            ipc.openExternal(GITHUB_URL).catch(fail);
          }}
        >
          GitHub
        </Button>
      </div>

      <p
        className="text-caption"
        style={{ color: 'var(--text-quaternary)', marginTop: 'var(--space-4)' }}
      >
        v{about?.version ?? '0.1.0'}
        {about?.platform ? ` · ${about.platform}` : ''} · {t('settings.aboutBy')}
      </p>
    </motion.div>
  );
}
