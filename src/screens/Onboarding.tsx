import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/Button';
import { springs } from '@/design/tokens';

const STEPS = [
  { title: 'Welcome to Perch', description: 'Your files, organized automatically. No fuss, no cloud, no accounts.' },
  { title: 'Set up a rule', description: 'Define conditions like file type, age, or name pattern. Choose an action: move, copy, rename, or trash.' },
  { title: 'You\'re all set', description: 'Perch watches your folders and keeps them tidy. Every operation can be undone.' },
];

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 'var(--space-12)' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          style={{ textAlign: 'center', maxWidth: 420 }}
        >
          <h1 className="text-hero" style={{ marginBottom: 'var(--space-4)' }}>{STEPS[step]!.title}</h1>
          <p className="text-body" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}>{STEPS[step]!.description}</p>
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-6)' }}>
        {STEPS.map((_, i) => (
          <motion.div
            key={i}
            animate={{ scale: i === step ? 1 : 0.75, opacity: i === step ? 1 : 0.3 }}
            transition={springs.snappy}
            style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--text-primary)' }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        {step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>}
        {step < STEPS.length - 1 ? (
          <Button variant="primary" onClick={() => setStep(step + 1)}>Continue</Button>
        ) : (
          <Button variant="primary" onClick={onComplete}>Get Started</Button>
        )}
      </div>
    </div>
  );
}
