import { Toggle } from '@/components/Toggle';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Glass } from '@/components/Glass';
import { useUIStore } from '@/store/ui';

export function SettingsScreen() {
  const { theme, setTheme } = useUIStore();

  return (
    <div style={{ padding: 'var(--space-6) 0', maxWidth: 560 }}>
      <h1 className="text-title" style={{ marginBottom: 'var(--space-6)' }}>Settings</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Appearance */}
        <Glass variant="card" padding="var(--space-4)" radius="var(--radius-lg)">
          <div className="text-caption" style={{ marginBottom: 'var(--space-3)' }}>APPEARANCE</div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {(['dark', 'light', 'auto'] as const).map((t) => (
              <Button key={t} variant={theme === t ? 'primary' : 'secondary'} size="sm" onClick={() => setTheme(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Button>
            ))}
          </div>
        </Glass>

        {/* Behavior */}
        <Glass variant="card" padding="var(--space-4)" radius="var(--radius-lg)">
          <div className="text-caption" style={{ marginBottom: 'var(--space-3)' }}>BEHAVIOR</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Toggle checked={false} onChange={() => {}} label="Launch at startup" />
            <Toggle checked={false} onChange={() => {}} label="Show in system tray" />
            <Toggle checked={false} onChange={() => {}} label="Quiet hours (22:00 – 08:00)" />
          </div>
        </Glass>

        {/* Data */}
        <Glass variant="card" padding="var(--space-4)" radius="var(--radius-lg)">
          <div className="text-caption" style={{ marginBottom: 'var(--space-3)' }}>DATA</div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="secondary" size="sm">Export Rules</Button>
            <Button variant="secondary" size="sm">Import Rules</Button>
          </div>
        </Glass>

        {/* About */}
        <Glass variant="card" padding="var(--space-4)" radius="var(--radius-lg)">
          <div className="text-caption" style={{ marginBottom: 'var(--space-3)' }}>ABOUT</div>
          <div className="text-body">Perch v0.1.0</div>
          <div className="text-secondary" style={{ marginTop: 2 }}>by Fuilex · MIT License</div>
          <div style={{ marginTop: 'var(--space-3)' }}>
            <Button variant="ghost" size="sm" onClick={() => window.open('https://github.com/fuilex/perch')}>
              GitHub
            </Button>
          </div>
        </Glass>
      </div>
    </div>
  );
}
