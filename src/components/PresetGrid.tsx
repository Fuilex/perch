import { motion } from 'framer-motion';
import { useApp } from '@/store/app';
import { useT } from '@/lib/i18n';
import { PRESETS, ruleFromPreset, type Preset } from '@/lib/presets';
import { listContainer, listItem } from '@/design/animations';

const ICONS: Record<Preset['icon'], JSX.Element> = {
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </>
  ),
  document: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </>
  ),
  archive: (
    <>
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
      <path d="M10 12h4" />
    </>
  ),
  camera: (
    <>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
  weight: (
    <>
      <circle cx="12" cy="5" r="3" />
      <path d="M6.5 8h11l2.5 12a1 1 0 0 1-1 1.2H5a1 1 0 0 1-1-1.2z" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </>
  ),
};

interface PresetGridProps {
  /** Narrower layout for the onboarding step. */
  compact?: boolean;
}

/**
 * The preset picker. Clicking one opens it in the rule editor — the user still
 * sees and confirms what it will do before anything is saved.
 */
export function PresetGrid({ compact }: PresetGridProps) {
  const t = useT();
  const ruleCount = useApp((s) => s.rules.length);
  const setEditingRule = useApp((s) => s.setEditingRule);

  return (
    <motion.div
      variants={listContainer}
      initial="hidden"
      animate="visible"
      style={{
        display: 'grid',
        gridTemplateColumns: compact ? 'repeat(2, minmax(0, 1fr))' : 'repeat(auto-fill, minmax(232px, 1fr))',
        gap: 'var(--space-2)',
        width: '100%',
        textAlign: 'left',
      }}
    >
      {PRESETS.map((preset) => (
        <motion.button
          key={preset.id}
          variants={listItem}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => setEditingRule(ruleFromPreset(preset, t(preset.nameKey), ruleCount))}
          className="glow-ring glow-ring--bloom"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-3)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--glass-fill)',
            boxShadow: 'inset 0 0 0 1px var(--glass-border-subtle)',
            textAlign: 'left',
          }}
        >
          <span
            aria-hidden="true"
            style={{ color: 'var(--text-tertiary)', display: 'flex', flexShrink: 0, marginTop: 1 }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {ICONS[preset.icon]}
            </svg>
          </span>
          <span style={{ minWidth: 0 }}>
            <span
              className="text-body"
              style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500 }}
            >
              {t(preset.nameKey)}
            </span>
            <span
              className="text-secondary"
              style={{ display: 'block', fontSize: '0.6875rem', marginTop: 2, lineHeight: 1.4 }}
            >
              {t(preset.descKey)}
            </span>
          </span>
        </motion.button>
      ))}
    </motion.div>
  );
}
