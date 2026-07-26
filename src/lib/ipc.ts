/**
 * Typed bridge to the Rust backend.
 *
 * Every type here mirrors a `serde` shape in src-tauri/src — keep them in step.
 * Nothing else in the UI should import from `@tauri-apps/api` directly, so this
 * file stays the only place that knows how the host is reached.
 */

import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export type Uuid = string;

/** `Condition` — adjacently tagged: `{ type, value }`. */
export type Condition =
  | { type: 'Extension'; value: string }
  | { type: 'Glob'; value: string }
  | { type: 'Regex'; value: string }
  | { type: 'SizeGreater'; value: number }
  | { type: 'SizeSmaller'; value: number }
  | { type: 'OlderThan'; value: number }
  | { type: 'NewerThan'; value: number }
  | { type: 'MimeType'; value: string }
  | { type: 'Duplicate' }
  | { type: 'MaxDepth'; value: number };

export type ConditionKind = Condition['type'];

/** `Action` — internally tagged, so the payload sits next to `type`. */
export type Action =
  | { type: 'Move'; dest_template: string }
  | { type: 'Copy'; dest_template: string }
  | { type: 'Rename'; template: string }
  | { type: 'Trash' }
  | { type: 'Unzip'; dest_template: string }
  | { type: 'RunCommand'; command: string };

export type ActionKind = Action['type'];

/** Unit enum with no serde attributes — serialises as a bare string. */
export type ActionType = 'Move' | 'Copy' | 'Rename' | 'Trash' | 'Unzip' | 'RunCommand';

export interface Rule {
  id: Uuid;
  name: string;
  enabled: boolean;
  conditions: Condition[];
  action: Action;
  stop_on_match: boolean;
  order: number;
}

export interface PlannedOperation {
  id: Uuid;
  source: string;
  destination: string | null;
  action_type: ActionType;
  rule_id: Uuid;
  rule_name: string;
  selected: boolean;
}

export interface JournalEntry {
  id: Uuid;
  batch_id: Uuid;
  rule_id: Uuid;
  source: string;
  destination: string | null;
  action_type: ActionType;
  timestamp: string;
  undone: boolean;
}

/** A journal entry flattened together with its rule's display name. */
export type ActivityEntry = JournalEntry & { rule_name: string };

export interface OperationFailure {
  source: string;
  rule_name: string;
  error: string;
}

export interface ExecutionReport {
  batch_id: Uuid;
  entries: JournalEntry[];
  failures: OperationFailure[];
}

export interface WatchedFolder {
  id: Uuid;
  path: string;
  enabled: boolean;
  recursive: boolean;
}

export interface QuietHours {
  start_hour: number;
  start_minute: number;
  end_hour: number;
  end_minute: number;
}

export type ThemeName = 'dark' | 'light' | 'auto';
export type Accent = 'mono' | 'blue' | 'violet' | 'green' | 'amber';
export type GlassIntensity = 'off' | 'light' | 'medium' | 'heavy';

export interface AppConfig {
  watched_folders: WatchedFolder[];
  quiet_hours: QuietHours | null;
  theme: ThemeName;
  accent: Accent;
  autostart: boolean;
  language: string;
  auto_organize: boolean;
  debounce_secs: number;
  tray_icon: boolean;
  minimize_to_tray: boolean;
  skip_hidden: boolean;
  confirm_before_apply: boolean;
  reduced_motion: boolean;
  glass_intensity: GlassIntensity;
}

export interface AppPaths {
  root: string;
  config: string;
  rules: string;
  journal: string;
}

export interface Stats {
  rules: number;
  enabled_rules: number;
  folders: number;
  enabled_folders: number;
  watched_files: number;
  operations: number;
  auto_organize: boolean;
  quiet_now: boolean;
}

export interface AboutInfo {
  version: string;
  platform: string;
}

/**
 * The local account. There is no server: "signing in" unlocks the app on this
 * machine. It gates access, it does not encrypt anything — the rules and journal
 * files stay readable on disk, and the UI says as much.
 */
export interface AccountState {
  /** A profile exists, so the app starts locked. */
  exists: boolean;
  username: string | null;
  created_at: string | null;
  unlocked: boolean;
}

// ---------------------------------------------------------------------------
// Host detection
// ---------------------------------------------------------------------------

/**
 * True when running inside the Tauri shell. `npm run dev` on its own serves the
 * UI in a plain browser where no backend exists; see `preview` below.
 */
export const isTauri: boolean =
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/**
 * Which capability limits actually bite in the current host. Conditions and
 * actions the Rust executor does not implement yet are listed here so the rule
 * editor can refuse to offer them — a `Duplicate` condition, for instance,
 * matches *every* file in `matcher.rs`, which would be a nasty surprise.
 */
export const UNIMPLEMENTED_CONDITIONS: ConditionKind[] = ['MimeType', 'Duplicate', 'MaxDepth'];
export const UNIMPLEMENTED_ACTIONS: ActionKind[] = ['Unzip', 'RunCommand'];

// ---------------------------------------------------------------------------
// invoke
// ---------------------------------------------------------------------------

/** Normalises the string errors the Rust side returns into real `Error`s. */
async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauri) return previewInvoke<T>(command, args);
  try {
    return await tauriInvoke<T>(command, args);
  } catch (error) {
    throw new Error(typeof error === 'string' ? error : String(error));
  }
}

// ---------------------------------------------------------------------------
// Commands — rules
// ---------------------------------------------------------------------------

export const getRules = () => invoke<Rule[]>('get_rules');
export const saveRule = (rule: Rule) => invoke<Rule[]>('save_rule', { rule });
export const deleteRule = (id: Uuid) => invoke<Rule[]>('delete_rule', { id });
export const toggleRule = (id: Uuid) => invoke<Rule[]>('toggle_rule', { id });
export const duplicateRule = (id: Uuid) => invoke<Rule[]>('duplicate_rule', { id });
export const reorderRules = (ids: Uuid[]) => invoke<Rule[]>('reorder_rules', { ids });

// ---------------------------------------------------------------------------
// Commands — watched folders
// ---------------------------------------------------------------------------

export const getWatchedFolders = () => invoke<WatchedFolder[]>('get_watched_folders');
export const addWatchedFolder = (path: string) => invoke<WatchedFolder[]>('add_watched_folder', { path });
export const removeWatchedFolder = (id: Uuid) => invoke<WatchedFolder[]>('remove_watched_folder', { id });
export const toggleWatchedFolder = (id: Uuid) => invoke<WatchedFolder[]>('toggle_watched_folder', { id });
export const setFolderRecursive = (id: Uuid, recursive: boolean) =>
  invoke<WatchedFolder[]>('set_folder_recursive', { id, recursive });
export const pickFolder = () => invoke<string | null>('pick_folder');

// ---------------------------------------------------------------------------
// Commands — planning and applying
// ---------------------------------------------------------------------------

export const dryRun = (folderPath?: string | null) =>
  invoke<PlannedOperation[]>('dry_run', { folderPath: folderPath ?? null });
export const applyOperations = (operations: PlannedOperation[]) =>
  invoke<ExecutionReport>('apply_operations', { operations });
export const organizeNow = () => invoke<ExecutionReport>('organize_now');
export const previewRule = (rule: Rule, folderPath?: string | null) =>
  invoke<PlannedOperation[]>('preview_rule', { rule, folderPath: folderPath ?? null });
/** Resolves to the unknown `{variables}` in a template — empty means valid. */
export const validateTemplate = (templateString: string) =>
  invoke<string[]>('validate_template', { templateString });
export const scanFolder = (path: string) => invoke<string[]>('scan_folder', { path });

// ---------------------------------------------------------------------------
// Commands — activity
// ---------------------------------------------------------------------------

export const getActivity = (limit?: number) => invoke<ActivityEntry[]>('get_activity', { limit: limit ?? null });
export const undoOperation = (id: Uuid) => invoke<void>('undo_operation', { id });
export const undoBatch = (batchId: Uuid) => invoke<number>('undo_batch', { batchId });
export const clearActivity = () => invoke<void>('clear_activity');

// ---------------------------------------------------------------------------
// Commands — settings
// ---------------------------------------------------------------------------

export const getSettings = () => invoke<AppConfig>('get_settings');
export const updateSettings = (config: AppConfig) => invoke<AppConfig>('update_settings', { config });
export const setAutoOrganize = (enabled: boolean) => invoke<AppConfig>('set_auto_organize', { enabled });
export const getAppPaths = () => invoke<AppPaths>('get_app_paths');
export const getStats = () => invoke<Stats>('get_stats');
/** Resolves to the written path, or null if the save dialog was dismissed. */
export const exportRules = () => invoke<string | null>('export_rules');
/** Resolves to the new rule list, or null if the open dialog was dismissed. */
export const importRules = (replace: boolean) => invoke<Rule[] | null>('import_rules', { replace });
export const revealPath = (path: string) => invoke<void>('reveal_path', { path });

// ---------------------------------------------------------------------------
// Commands — account
//
// These are the way in, so they work while the app is locked. Everything above
// refuses with "Perch is locked — sign in first" until sign-in succeeds.
// ---------------------------------------------------------------------------

export const getAccount = () => invoke<AccountState>('get_account');
export const minPasswordLength = () => invoke<number>('min_password_length');
export const createAccount = (username: string, password: string) =>
  invoke<AccountState>('create_account', { username, password });
export const signIn = (password: string) => invoke<AccountState>('sign_in', { password });
export const signOut = () => invoke<AccountState>('sign_out');
export const changePassword = (currentPassword: string, newPassword: string) =>
  invoke<AccountState>('change_password', { currentPassword, newPassword });
export const deleteAccount = (password: string) =>
  invoke<AccountState>('delete_account', { password });

// ---------------------------------------------------------------------------
// Commands — window and misc
// ---------------------------------------------------------------------------

/**
 * Opens a link in the system browser.
 *
 * `window.open` does nothing inside the Tauri webview — there is no browser
 * chrome to open a tab in, so the call is simply swallowed. The shell plugin
 * hands the URL to the OS instead; `shell:allow-open` in the capability file is
 * what permits it.
 */
export async function openExternal(url: string): Promise<void> {
  if (!isTauri) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  const { open } = await import('@tauri-apps/plugin-shell');
  await open(url);
}

export const quitApp = () => invoke<void>('quit_app');
export const hideToTray = () => invoke<void>('hide_to_tray');
export const getAbout = () => invoke<AboutInfo>('get_about');
export const ping = () => invoke<string>('ping');

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const EVENT_ACTIVITY = 'perch://activity';
export const EVENT_SETTINGS = 'perch://settings';

type Unlisten = () => void;

/** Fires whenever the backend applies operations — including from the tray. */
export async function onActivity(handler: (report: ExecutionReport) => void): Promise<Unlisten> {
  if (!isTauri) return () => {};
  return listen<ExecutionReport>(EVENT_ACTIVITY, (event) => handler(event.payload));
}

/** Fires when settings change outside this window (tray, autostart sync). */
export async function onSettings(handler: (config: AppConfig) => void): Promise<Unlisten> {
  if (!isTauri) return () => {};
  return listen<AppConfig>(EVENT_SETTINGS, (event) => handler(event.payload));
}

// ---------------------------------------------------------------------------
// Preview mode
// ---------------------------------------------------------------------------

/**
 * Serves `npm run dev` in a plain browser, where there is no Rust side at all.
 * State lives in memory for the session so the interface can be worked on
 * without a full rebuild; the UI shows a "preview" badge whenever this is live.
 * Anything touching real files refuses outright rather than pretending.
 */
const previewState: { config: AppConfig; rules: Rule[]; account: AccountState } = {
  account: { exists: false, username: null, created_at: null, unlocked: true },
  config: {
    watched_folders: [],
    quiet_hours: null,
    theme: 'dark',
    accent: 'mono',
    autostart: false,
    language: 'ru',
    auto_organize: false,
    debounce_secs: 5,
    tray_icon: true,
    minimize_to_tray: true,
    skip_hidden: true,
    confirm_before_apply: true,
    reduced_motion: false,
    glass_intensity: 'medium',
  },
  rules: [],
};

function previewInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const ok = (value: unknown) => Promise.resolve(value as T);
  const rules = previewState.rules;

  switch (command) {
    case 'ping':
      return ok('perch');
    case 'get_rules':
      return ok(rules);
    case 'save_rule': {
      const rule = args?.rule as Rule;
      const at = rules.findIndex((r) => r.id === rule.id);
      if (at >= 0) rules[at] = rule;
      else rules.push({ ...rule, order: rules.length });
      return ok([...rules]);
    }
    case 'delete_rule':
      previewState.rules = rules.filter((r) => r.id !== args?.id);
      return ok([...previewState.rules]);
    case 'toggle_rule':
      return ok(rules.map((r) => (r.id === args?.id ? { ...r, enabled: !r.enabled } : r)));
    case 'duplicate_rule': {
      const original = rules.find((r) => r.id === args?.id);
      if (original) {
        rules.push({ ...original, id: crypto.randomUUID(), name: `${original.name} copy`, order: rules.length });
      }
      return ok([...rules]);
    }
    case 'reorder_rules': {
      const ids = (args?.ids as Uuid[]) ?? [];
      previewState.rules = ids
        .map((id, order) => {
          const rule = rules.find((r) => r.id === id);
          return rule ? { ...rule, order } : null;
        })
        .filter((r): r is Rule => r !== null);
      return ok([...previewState.rules]);
    }
    case 'get_settings':
      return ok(previewState.config);
    case 'update_settings':
      previewState.config = args?.config as AppConfig;
      return ok(previewState.config);
    case 'set_auto_organize':
      previewState.config = { ...previewState.config, auto_organize: Boolean(args?.enabled) };
      return ok(previewState.config);
    case 'get_watched_folders':
      return ok(previewState.config.watched_folders);
    case 'get_activity':
      return ok([]);
    case 'validate_template':
      return ok([]);
    case 'get_about':
      return ok({ version: '0.1.0', platform: 'preview' });
    case 'min_password_length':
      return ok(8);
    case 'get_account':
      return ok(previewState.account);
    case 'create_account': {
      previewState.account = {
        exists: true,
        username: String(args?.username ?? '').trim(),
        created_at: new Date().toISOString(),
        unlocked: true,
      };
      return ok(previewState.account);
    }
    case 'sign_in':
      // No hash to check against in preview; the lock screen is still shown so
      // it can be worked on, and any password gets past it.
      previewState.account = { ...previewState.account, unlocked: true };
      return ok(previewState.account);
    case 'sign_out':
      previewState.account = { ...previewState.account, unlocked: !previewState.account.exists };
      return ok(previewState.account);
    case 'delete_account':
      previewState.account = { exists: false, username: null, created_at: null, unlocked: true };
      return ok(previewState.account);
    case 'change_password':
      return ok(previewState.account);
    case 'get_app_paths':
      return ok({ root: '—', config: '—', rules: '—', journal: '—' });
    case 'get_stats':
      return ok({
        rules: rules.length,
        enabled_rules: rules.filter((r) => r.enabled).length,
        folders: 0,
        enabled_folders: 0,
        watched_files: 0,
        operations: 0,
        auto_organize: previewState.config.auto_organize,
        quiet_now: false,
      });
    case 'dry_run':
    case 'preview_rule':
      return ok([]);
    case 'clear_activity':
    case 'reveal_path':
      return ok(undefined);
    default:
      return Promise.reject(
        new Error('Not available in preview — run the desktop app with `npm run tauri dev`.'),
      );
  }
}
