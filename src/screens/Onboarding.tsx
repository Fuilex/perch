import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/store/app';
import { Button } from '@/components/Button';
import { Logo } from '@/components/Brand';
import { PresetGrid } from '@/components/PresetGrid';
import { basename } from '@/lib/format';
import { useT } from '@/lib/i18n';
import { springs } from '@/design/tokens';

interface OnboardingProps {
  onComplete: () => void;
}

/**
 * Four steps, and the middle two do real work: the folder picker goes through
 * the same command Settings uses, and the presets open in the real editor. So
 * nothing here has to be redone afterwards.
 */
export function Onboarding({ onComplete }: OnboardingProps) {
  const t = useT();
  const [step, setStep] = useState(0);
  const folders = useApp((s) => s.folders);
  const addFolder = useApp((s) => s.addFolder);
  const preview = useApp((s) => s.preview);
  const ruleCount = useApp((s) => s.rules.length);

  const steps = [
    {
      title: t('onboard.step1Title'),
      body: t('onboard.step1Body'),
      extra: null,
      action: (
        <Button variant="primary" onClick={() => setStep(1)}>
          {t('onboard.continue')}
        </Button>
      ),
    },
    {
      title: t('onboard.step2Title'),
      body:
        folders.length > 0
          ? t('onboard.step2Watching', { names: folders.map((f) => basename(f.path)).join(', ') })
          : t('onboard.step2Body'),
      extra: null,
      action: (
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant={folders.length > 0 ? 'secondary' : 'primary'}
            disabled={preview}
            onClick={() => void addFolder()}
          >
            {folders.length > 0 ? t('onboard.addAnother') : t('onboard.choose')}
          </Button>
          <Button variant={folders.length > 0 ? 'primary' : 'ghost'} onClick={() => setStep(2)}>
            {folders.length > 0 ? t('onboard.continue') : t('onboard.skip')}
          </Button>
        </div>
      ),
    },
    {
      title: t('onboard.step3Title'),
      body: t('onboard.step3Body'),
      extra: <PresetGrid compact />,
      action: (
        <Button variant={ruleCount > 0 ? 'primary' : 'ghost'} onClick={() => setStep(3)}>
          {ruleCount > 0 ? t('onboard.continue') : t('onboard.skip')}
        </Button>
      ),
    },
    {
      title: t('onboard.step4Title'),
      body: t('onboard.step4Body'),
      extra: null,
      action: (
        <Button variant="primary" onClick={onComplete}>
          {t('onboard.start')}
        </Button>
      ),
    },
  ];

  const current = steps[step]!;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: 'var(--space-10) var(--space-12)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <Logo
        height={34}
        style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-8)', opacity: 0.9 }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
          style={{
            textAlign: 'center',
            maxWidth: current.extra ? 540 : 460,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h1 className="text-hero" style={{ marginBottom: 'var(--space-3)' }}>
            {current.title}
          </h1>
          <p
            className="text-body"
            style={{
              color: 'var(--text-secondary)',
              marginBottom: current.extra ? 'var(--space-5)' : 'var(--space-8)',
            }}
          >
            {current.body}
          </p>
          {current.extra}
        </motion.div>
      </AnimatePresence>

      <div style={{ display: 'flex', gap: 8, margin: 'var(--space-6) 0' }}>
        {steps.map((_, index) => (
          <motion.button
            key={index}
            aria-label={t('onboard.step', { number: index + 1 })}
            onClick={() => setStep(index)}
            animate={{ scale: index === step ? 1 : 0.75, opacity: index === step ? 1 : 0.3 }}
            transition={springs.snappy}
            style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--text-primary)' }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
        {step > 0 && (
          <Button variant="ghost" onClick={() => setStep(step - 1)}>
            {t('onboard.back')}
          </Button>
        )}
        {current.action}
      </div>
    </div>
  );
}
