import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/store/app';
import { Logo } from '@/components/Brand';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useT, type Translate } from '@/lib/i18n';
import { springs } from '@/design/tokens';

/**
 * Sign in, or create the account if there isn't one yet.
 *
 * Shown instead of the app when a profile exists and the session is locked. The
 * backend refuses the data commands in that state regardless of what this screen
 * does, so getting past it by other means gains nothing.
 */
export function LockScreen() {
  const account = useApp((s) => s.account);
  const creating = !account?.exists;

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: 'var(--space-12)',
      }}
    >
      <Logo height={34} style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-10)' }} />
      {creating ? <CreateForm /> : <SignInForm />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sign in
// ---------------------------------------------------------------------------

function SignInForm() {
  const t = useT();
  const account = useApp((s) => s.account);
  const signIn = useApp((s) => s.signIn);

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    field.current?.focus();
  }, []);

  const submit = async () => {
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(password);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPassword('');
      setShake((n) => n + 1);
      field.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.form
      key={shake}
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      initial={shake === 0 ? { opacity: 0, y: 12 } : { x: 0 }}
      animate={shake === 0 ? { opacity: 1, y: 0 } : { x: [0, -9, 8, -5, 0] }}
      transition={shake === 0 ? { duration: 0.3, ease: [0.32, 0.72, 0, 1] } : { duration: 0.38 }}
      style={{ width: 320, textAlign: 'center' }}
    >
      <h1 className="text-title" style={{ marginBottom: 'var(--space-1)' }}>
        {account?.username
          ? t('lock.welcomeBackNamed', { name: account.username })
          : t('lock.welcomeBack')}
      </h1>
      <p
        className="text-secondary"
        style={{ fontSize: '0.8125rem', marginBottom: 'var(--space-6)' }}
      >
        {t('lock.lockedNote')}
      </p>

      <Input
        ref={field}
        type="password"
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          setError(null);
        }}
        placeholder={t('lock.password')}
        aria-label={t('lock.password')}
        autoComplete="current-password"
        error={error ?? undefined}
        style={{ textAlign: 'center' }}
      />

      <Button
        variant="primary"
        size="lg"
        type="submit"
        loading={busy}
        disabled={!password}
        style={{ width: '100%', marginTop: 'var(--space-4)' }}
      >
        {t('lock.unlock')}
      </Button>

      <p
        className="text-secondary"
        style={{ fontSize: '0.6875rem', marginTop: 'var(--space-6)', lineHeight: 1.5 }}
      >
        {t('lock.forgot')}
      </p>
    </motion.form>
  );
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

function CreateForm() {
  const t = useT();
  const createAccount = useApp((s) => s.createAccount);
  const minLength = useApp((s) => s.minPasswordLength);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const tooShort = password.length > 0 && password.length < minLength;
  const mismatch = confirm.length > 0 && confirm !== password;
  const ready = username.trim() !== '' && password.length >= minLength && confirm === password;

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      await createAccount(username, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      style={{ width: 340 }}
    >
      <h1 className="text-title" style={{ textAlign: 'center', marginBottom: 'var(--space-1)' }}>
        {t('lock.createTitle')}
      </h1>
      <p
        className="text-secondary"
        style={{ fontSize: '0.8125rem', textAlign: 'center', marginBottom: 'var(--space-6)' }}
      >
        {t('lock.createSubtitle')}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <Input
          label={t('lock.name')}
          value={username}
          onChange={(event) => {
            setUsername(event.target.value);
            setError(null);
          }}
          placeholder={t('lock.namePlaceholder')}
          autoComplete="username"
          autoFocus
        />

        <Input
          label={t('lock.password')}
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError(null);
          }}
          autoComplete="new-password"
          hint={t('lock.minLength', { count: minLength })}
          error={tooShort ? t('lock.minLength', { count: minLength }) : undefined}
        />

        <Input
          label={t('settings.repeatPassword')}
          type="password"
          value={confirm}
          onChange={(event) => {
            setConfirm(event.target.value);
            setError(null);
          }}
          autoComplete="new-password"
          error={mismatch ? t('lock.mismatch') : undefined}
        />

        <PasswordMeter password={password} minLength={minLength} t={t} />

        {error && (
          <p className="text-body" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
            {error}
          </p>
        )}

        <Button variant="primary" size="lg" type="submit" loading={busy} disabled={!ready}>
          {t('lock.create')}
        </Button>
      </div>

      <p
        className="text-secondary"
        style={{ fontSize: '0.6875rem', marginTop: 'var(--space-5)', lineHeight: 1.5 }}
      >
        {t('lock.notEncryption')}
      </p>
    </motion.form>
  );
}

/**
 * Length-based strength hint. Deliberately not a scolding validator: the only
 * rule the backend enforces is the minimum length.
 */
function PasswordMeter({
  password,
  minLength,
  t,
}: {
  password: string;
  minLength: number;
  t: Translate;
}) {
  const variety =
    Number(/[a-z]/.test(password)) +
    Number(/[A-Z]/.test(password)) +
    Number(/\d/.test(password)) +
    Number(/[^\w\s]/.test(password));

  const score = password.length === 0 ? 0 : Math.min(4, Math.floor(password.length / 5) + variety - 1);
  const labels = [
    '',
    t('lock.strengthShort'),
    t('lock.strengthFine'),
    t('lock.strengthGood'),
    t('lock.strengthStrong'),
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', height: 16 }}>
      <div style={{ display: 'flex', gap: 3, flex: 1 }}>
        {[0, 1, 2, 3].map((step) => (
          <motion.div
            key={step}
            animate={{
              backgroundColor:
                password.length >= minLength && score > step
                  ? 'var(--accent)'
                  : 'var(--glass-fill-hover)',
            }}
            transition={springs.snappy}
            style={{ height: 3, flex: 1, borderRadius: 2 }}
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.span
          key={labels[score]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-caption"
          style={{ color: 'var(--text-tertiary)', width: 46, textAlign: 'right' }}
        >
          {password.length >= minLength ? labels[score] : ''}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
