import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/store/app';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Select } from '@/components/Select';
import { SettingGroup, SettingRow } from '@/components/Setting';
import { Stepper } from '@/components/Stepper';
import { Toggle } from '@/components/Toggle';
import * as ipc from '@/lib/ipc';
import { listContainer } from '@/design/animations';
import { formatClock } from '@/lib/format';
import { LANGUAGES, asLanguage, useT, type Translate } from '@/lib/i18n';
import type { Accent, GlassIntensity, QuietHours, ThemeName } from '@/lib/ipc';

const DEFAULT_QUIET: QuietHours = { start_hour: 22, start_minute: 0, end_hour: 8, end_minute: 0 };

const HOURS = Array.from({ length: 24 }, (_, hour) => ({
  value: hour,
  label: String(hour).padStart(2, '0'),
}));
const MINUTES = [0, 15, 30, 45].map((minute) => ({
  value: minute,
  label: String(minute).padStart(2, '0'),
}));

/**
 * `mono` is the standard accent and it is white — the interface is monochrome
 * unless you ask for otherwise, which is why it comes first and is labelled by
 * its colour rather than by the enum name the backend uses.
 */
const ACCENTS: Array<{ value: Accent; labelKey: Parameters<Translate>[0]; swatch: string }> = [
  { value: 'mono', labelKey: 'settings.accentWhite', swatch: '#F5F5F7' },
  { value: 'blue', labelKey: 'settings.accentBlue', swatch: '#0A84FF' },
  { value: 'violet', labelKey: 'settings.accentViolet', swatch: '#8E7CFF' },
  { value: 'green', labelKey: 'settings.accentGreen', swatch: '#30D158' },
  { value: 'amber', labelKey: 'settings.accentAmber', swatch: '#FF9F0A' },
];

/**
 * Everything in `AppConfig`, editable here. There is no config file to hand-edit
 * — each control writes through `update_settings`, which persists to disk and
 * re-applies the OS-level side effects (autostart, the folder watcher, the tray).
 */
export function SettingsScreen() {
  const t = useT();
  const config = useApp((s) => s.config);
  const stats = useApp((s) => s.stats);
  const paths = useApp((s) => s.paths);
  const about = useApp((s) => s.about);
  const preview = useApp((s) => s.preview);
  const patch = useApp((s) => s.patchConfig);
  const exportRules = useApp((s) => s.exportRules);
  const importRules = useApp((s) => s.importRules);
  const fail = useApp((s) => s.fail);

  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  if (!config) return null;

  const quiet = config.quiet_hours;

  const setQuiet = (next: Partial<QuietHours>) =>
    void patch({ quiet_hours: { ...(quiet ?? DEFAULT_QUIET), ...next } });

  const themes: Array<{ value: ThemeName; label: string }> = [
    { value: 'dark', label: t('settings.themeDark') },
    { value: 'light', label: t('settings.themeLight') },
    { value: 'auto', label: t('settings.themeAuto') },
  ];

  const glass: Array<{ value: GlassIntensity; label: string }> = [
    { value: 'off', label: t('settings.glassOff') },
    { value: 'light', label: t('settings.glassLight') },
    { value: 'medium', label: t('settings.glassMedium') },
    { value: 'heavy', label: t('settings.glassHeavy') },
  ];

  return (
    <div style={{ padding: 'var(--space-6) 0 var(--space-12)', maxWidth: 640 }}>
      <header style={{ marginBottom: 'var(--space-5)' }}>
        <h1 className="text-title">{t('settings.title')}</h1>
        <p className="text-secondary" style={{ fontSize: '0.8125rem', marginTop: 2 }}>
          {t('settings.subtitle')}
        </p>
      </header>

      <motion.div
        variants={listContainer}
        initial="hidden"
        animate="visible"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
      >
        {/* ---------------------------------------------------------------- */}
        <SettingGroup title={t('settings.appearance')}>
          <SettingRow label={t('settings.language')} description={t('settings.languageHint')}>
            <SegmentedControl
              ariaLabel={t('settings.language')}
              size="sm"
              value={asLanguage(config.language)}
              segments={LANGUAGES}
              onChange={(language) => void patch({ language })}
            />
          </SettingRow>

          <SettingRow label={t('settings.theme')}>
            <SegmentedControl
              ariaLabel={t('settings.theme')}
              size="sm"
              value={config.theme}
              segments={themes}
              onChange={(theme) => void patch({ theme })}
            />
          </SettingRow>

          <SettingRow label={t('settings.accent')} description={t('settings.accentHint')}>
            <div style={{ display: 'flex', gap: 6 }}>
              {ACCENTS.map((accent) => {
                const selected = config.accent === accent.value;
                return (
                  <motion.button
                    key={accent.value}
                    aria-label={t(accent.labelKey)}
                    aria-pressed={selected}
                    title={t(accent.labelKey)}
                    onClick={() => void patch({ accent: accent.value })}
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: accent.swatch,
                      boxShadow: selected
                        ? '0 0 0 2px var(--color-bg-to), 0 0 0 3.5px var(--text-primary)'
                        : 'inset 0 0 0 1px var(--glass-border)',
                    }}
                  />
                );
              })}
            </div>
          </SettingRow>

          <SettingRow label={t('settings.glass')} description={t('settings.glassHint')}>
            <SegmentedControl
              ariaLabel={t('settings.glass')}
              size="sm"
              value={config.glass_intensity}
              segments={glass}
              onChange={(glass_intensity) => void patch({ glass_intensity })}
            />
          </SettingRow>

          <SettingRow
            label={t('settings.reduceMotion')}
            description={t('settings.reduceMotionHint')}
          >
            <Toggle
              checked={config.reduced_motion}
              onChange={(reduced_motion) => void patch({ reduced_motion })}
              id="reduced-motion"
              ariaLabel={t('settings.reduceMotion')}
            />
          </SettingRow>
        </SettingGroup>

        {/* ---------------------------------------------------------------- */}
        <SettingGroup
          title={t('settings.organizing')}
          aside={
            stats && (
              <span className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
                {stats.quiet_now
                  ? t('status.quiet')
                  : stats.auto_organize
                    ? t('status.watching')
                    : t('status.manual')}
              </span>
            )
          }
        >
          <SettingRow
            label={t('settings.autoOrganize')}
            description={t('settings.autoOrganizeHint')}
          >
            <Toggle
              checked={config.auto_organize}
              onChange={(auto_organize) => void patch({ auto_organize })}
              id="auto-organize"
              ariaLabel={t('settings.autoOrganize')}
            />
          </SettingRow>

          <SettingRow
            label={t('settings.debounce')}
            description={t('settings.debounceHint')}
            disabled={!config.auto_organize}
          >
            <Stepper
              ariaLabel={t('settings.debounce')}
              value={config.debounce_secs}
              min={1}
              max={3600}
              suffix="s"
              onChange={(debounce_secs) => void patch({ debounce_secs })}
            />
          </SettingRow>

          <SettingRow label={t('settings.confirm')} description={t('settings.confirmHint')}>
            <Toggle
              checked={config.confirm_before_apply}
              onChange={(confirm_before_apply) => void patch({ confirm_before_apply })}
              id="confirm-before-apply"
              ariaLabel={t('settings.confirm')}
            />
          </SettingRow>

          <SettingRow label={t('settings.skipHidden')} description={t('settings.skipHiddenHint')}>
            <Toggle
              checked={config.skip_hidden}
              onChange={(skip_hidden) => void patch({ skip_hidden })}
              id="skip-hidden"
              ariaLabel={t('settings.skipHidden')}
            />
          </SettingRow>

          <SettingRow
            label={t('settings.quietHours')}
            description={
              quiet
                ? t('settings.quietHoursOn', {
                    from: formatClock(quiet.start_hour, quiet.start_minute),
                    to: formatClock(quiet.end_hour, quiet.end_minute),
                  })
                : t('settings.quietHoursOff')
            }
          >
            <Toggle
              checked={Boolean(quiet)}
              onChange={(on) => void patch({ quiet_hours: on ? DEFAULT_QUIET : null })}
              id="quiet-hours"
              ariaLabel={t('settings.quietHours')}
            />
          </SettingRow>

          {quiet && (
            <SettingRow
              label={t('settings.quietWindow')}
              description={t('settings.quietWindowHint')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Select
                  aria-label={t('settings.quietWindow')}
                  value={quiet.start_hour}
                  options={HOURS}
                  numeric
                  onChange={(start_hour) => setQuiet({ start_hour })}
                />
                <Select
                  aria-label={t('settings.quietWindow')}
                  value={quiet.start_minute}
                  options={MINUTES}
                  numeric
                  onChange={(start_minute) => setQuiet({ start_minute })}
                />
                <span className="text-secondary" style={{ fontSize: '0.8125rem' }}>
                  {t('settings.to')}
                </span>
                <Select
                  aria-label={t('settings.quietWindow')}
                  value={quiet.end_hour}
                  options={HOURS}
                  numeric
                  onChange={(end_hour) => setQuiet({ end_hour })}
                />
                <Select
                  aria-label={t('settings.quietWindow')}
                  value={quiet.end_minute}
                  options={MINUTES}
                  numeric
                  onChange={(end_minute) => setQuiet({ end_minute })}
                />
              </div>
            </SettingRow>
          )}
        </SettingGroup>

        {/* ---------------------------------------------------------------- */}
        <SettingGroup title={t('settings.system')}>
          <SettingRow label={t('settings.autostart')} description={t('settings.autostartHint')}>
            <Toggle
              checked={config.autostart}
              onChange={(autostart) => void patch({ autostart })}
              id="autostart"
              ariaLabel={t('settings.autostart')}
            />
          </SettingRow>

          <SettingRow label={t('settings.tray')} description={t('settings.trayHint')}>
            <Toggle
              checked={config.tray_icon}
              onChange={(tray_icon) => void patch({ tray_icon })}
              id="tray-icon"
              ariaLabel={t('settings.tray')}
            />
          </SettingRow>

          <SettingRow
            label={t('settings.minimizeToTray')}
            description={t('settings.minimizeToTrayHint')}
            disabled={!config.tray_icon}
          >
            <Toggle
              checked={config.minimize_to_tray}
              onChange={(minimize_to_tray) => void patch({ minimize_to_tray })}
              id="minimize-to-tray"
              ariaLabel={t('settings.minimizeToTray')}
            />
          </SettingRow>
        </SettingGroup>

        {/* ---------------------------------------------------------------- */}
        <AccountSection />

        {/* ---------------------------------------------------------------- */}
        <SettingGroup title={t('settings.rules')}>
          <SettingRow label={t('settings.export')} description={t('settings.exportHint')}>
            <Button variant="secondary" size="sm" onClick={() => void exportRules()}>
              {t('settings.exportAction')}
            </Button>
          </SettingRow>

          <SettingRow label={t('settings.import')} description={t('settings.importHint')}>
            <SegmentedControl
              ariaLabel={t('settings.import')}
              size="sm"
              value={importMode}
              segments={[
                { value: 'merge', label: t('settings.importAdd') },
                { value: 'replace', label: t('settings.importReplace') },
              ]}
              onChange={setImportMode}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void importRules(importMode === 'replace')}
            >
              {t('settings.importAction')}
            </Button>
          </SettingRow>
        </SettingGroup>

        {/* ---------------------------------------------------------------- */}
        {paths && (
          <SettingGroup title={t('settings.onDisk')}>
            {(
              [
                [t('settings.dataFolder'), paths.root],
                [t('settings.configFile'), paths.config],
                [t('settings.rulesFile'), paths.rules],
                [t('settings.journalFile'), paths.journal],
              ] as const
            ).map(([label, path]) => (
              <SettingRow key={label} label={label} stacked>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <code
                    className="text-mono text-truncate"
                    style={{
                      flex: 1,
                      fontSize: '0.6875rem',
                      color: 'var(--text-tertiary)',
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--glass-fill)',
                    }}
                    title={path}
                  >
                    {path}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={preview}
                    onClick={() => {
                      ipc.revealPath(path).catch(fail);
                    }}
                  >
                    {t('common.show')}
                  </Button>
                </div>
              </SettingRow>
            ))}
          </SettingGroup>
        )}

        {/* ---------------------------------------------------------------- */}
        <SettingGroup title={t('settings.about')}>
          <SettingRow
            label={`Perch ${about?.version ?? '0.1.0'}`}
            description={`${t('settings.aboutBy')}${about?.platform ? ` · ${about.platform}` : ''}`}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                ipc.openExternal('https://github.com/Fuilex/perch').catch(fail);
              }}
            >
              GitHub
            </Button>
          </SettingRow>

          {stats && (
            <SettingRow
              label={t('settings.totals')}
              description={t('settings.totalsValue', {
                enabledRules: stats.enabled_rules,
                rules: stats.rules,
                enabledFolders: stats.enabled_folders,
                folders: stats.folders,
                operations: stats.operations,
              })}
            />
          )}

          <SettingRow label={t('settings.quit')} description={t('settings.quitHint')}>
            <Button
              variant="secondary"
              size="sm"
              disabled={preview}
              onClick={() => {
                ipc.quitApp().catch(fail);
              }}
            >
              {t('settings.quitAction')}
            </Button>
          </SettingRow>
        </SettingGroup>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

/**
 * The local account. Setting a password here is optional — without one Perch
 * opens straight away, which is the right default for a single-user machine.
 */
function AccountSection() {
  const t = useT();
  const account = useApp((s) => s.account);
  const minLength = useApp((s) => s.minPasswordLength);
  const preview = useApp((s) => s.preview);
  const createAccount = useApp((s) => s.createAccount);
  const changePassword = useApp((s) => s.changePassword);
  const deleteAccount = useApp((s) => s.deleteAccount);
  const signOut = useApp((s) => s.signOut);

  const [mode, setMode] = useState<'idle' | 'create' | 'change' | 'delete'>('idle');
  const [username, setUsername] = useState('');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setMode('idle');
    setUsername('');
    setCurrent('');
    setNext('');
    setConfirm('');
    setError(null);
  };

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const exists = Boolean(account?.exists);
  const created = account?.created_at ? new Date(account.created_at).toLocaleDateString() : null;

  return (
    <SettingGroup title={t('settings.account')}>
      <SettingRow
        label={exists ? (account?.username ?? t('settings.account')) : t('settings.accountNone')}
        description={
          exists
            ? created
              ? t('settings.accountSince', { date: created })
              : t('settings.accountNotEncrypted')
            : t('settings.accountNoneHint')
        }
      >
        {exists ? (
          <Button variant="secondary" size="sm" onClick={() => void signOut()}>
            {t('settings.signOut')}
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            disabled={preview}
            onClick={() => setMode(mode === 'create' ? 'idle' : 'create')}
          >
            {t('settings.accountCreate')}
          </Button>
        )}
      </SettingRow>

      {mode === 'create' && (
        <SettingRow label={t('settings.accountCreate')} description={t('settings.accountNotEncrypted')} stacked>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <Input
              label={t('lock.name')}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
            <Input
              label={t('settings.newPassword')}
              type="password"
              value={next}
              onChange={(event) => setNext(event.target.value)}
              autoComplete="new-password"
              hint={t('lock.minLength', { count: minLength })}
            />
            <Input
              label={t('settings.repeatPassword')}
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="new-password"
              error={confirm && confirm !== next ? t('lock.mismatch') : undefined}
            />
            {error && (
              <span className="text-body" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                {error}
              </span>
            )}
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="sm" onClick={reset}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={busy}
                disabled={!username.trim() || next.length < minLength || next !== confirm}
                onClick={() => void run(() => createAccount(username, next))}
              >
                {t('lock.create')}
              </Button>
            </div>
          </div>
        </SettingRow>
      )}

      {exists && (
        <SettingRow label={t('settings.changePassword')}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMode(mode === 'change' ? 'idle' : 'change')}
          >
            {t('settings.changePassword')}
          </Button>
        </SettingRow>
      )}

      {exists && mode === 'change' && (
        <SettingRow label={t('settings.changePassword')} stacked>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <Input
              label={t('settings.currentPassword')}
              type="password"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
              autoComplete="current-password"
            />
            <Input
              label={t('settings.newPassword')}
              type="password"
              value={next}
              onChange={(event) => setNext(event.target.value)}
              autoComplete="new-password"
              hint={t('lock.minLength', { count: minLength })}
            />
            <Input
              label={t('settings.repeatPassword')}
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="new-password"
              error={confirm && confirm !== next ? t('lock.mismatch') : undefined}
            />
            {error && (
              <span className="text-body" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                {error}
              </span>
            )}
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="sm" onClick={reset}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={busy}
                disabled={!current || next.length < minLength || next !== confirm}
                onClick={() => void run(() => changePassword(current, next))}
              >
                {t('common.save')}
              </Button>
            </div>
          </div>
        </SettingRow>
      )}

      {exists && (
        <SettingRow
          label={t('settings.deleteAccount')}
          description={t('settings.deleteAccountHint')}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode(mode === 'delete' ? 'idle' : 'delete')}
          >
            {t('settings.deleteAccount')}
          </Button>
        </SettingRow>
      )}

      {exists && mode === 'delete' && (
        <SettingRow label={t('settings.currentPassword')} stacked>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <Input
              type="password"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
              autoComplete="current-password"
              aria-label={t('settings.currentPassword')}
            />
            {error && (
              <span className="text-body" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                {error}
              </span>
            )}
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="sm" onClick={reset}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                loading={busy}
                disabled={!current}
                onClick={() => void run(() => deleteAccount(current))}
              >
                {t('common.confirmDelete')}
              </Button>
            </div>
          </div>
        </SettingRow>
      )}

      {exists && created && (
        <SettingRow
          label={t('settings.signOut')}
          description={`${t('settings.signOutHint')} ${t('settings.accountNotEncrypted')}`}
        />
      )}
    </SettingGroup>
  );
}
