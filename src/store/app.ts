/**
 * The single source of truth for the UI.
 *
 * Rules, folders and settings all live in the Rust backend, which writes each
 * change straight to disk. Every mutation here therefore goes out over IPC and
 * stores whatever comes back, rather than keeping a local copy and hoping the
 * two agree.
 */

import { create } from 'zustand';
import * as ipc from '@/lib/ipc';
import type {
  AccountState,
  ActivityEntry,
  AppConfig,
  AppPaths,
  AboutInfo,
  ExecutionReport,
  PlannedOperation,
  Rule,
  Stats,
  Uuid,
  WatchedFolder,
} from '@/lib/ipc';
import type { TranslateParams, TranslationKey } from '@/lib/i18n';

export type Screen = 'rules' | 'activity' | 'folders' | 'settings' | 'about';

/**
 * Toasts carry a translation key rather than a finished string, so they read in
 * the current language whenever they are rendered — and so this file needs only
 * i18n's types, not the translator itself.
 */
export interface Toast {
  id: string;
  tone: 'neutral' | 'error';
  /** Either a key to translate… */
  key?: TranslationKey;
  params?: TranslateParams;
  /** …or text the backend produced, which is already a sentence. */
  text?: string;
  action?: { labelKey: TranslationKey; run: () => void };
}

interface AppState {
  // Lifecycle
  ready: boolean;
  /** Running in a plain browser with no backend behind it. */
  preview: boolean;
  loadError: string | null;

  // Account. `account.unlocked` is what the lock screen keys off; the backend
  // refuses the data commands independently, so this is not the only guard.
  account: AccountState | null;
  minPasswordLength: number;

  // Backend state
  config: AppConfig | null;
  rules: Rule[];
  folders: WatchedFolder[];
  activity: ActivityEntry[];
  stats: Stats | null;
  paths: AppPaths | null;
  about: AboutInfo | null;

  // UI state
  screen: Screen;
  editingRule: Rule | null;
  /** Non-null while the dry-run review sheet is up. */
  review: PlannedOperation[] | null;
  reviewBusy: boolean;
  paletteOpen: boolean;
  busy: boolean;
  toasts: Toast[];

  // Lifecycle actions
  init: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshActivity: () => Promise<void>;

  // Account
  createAccount: (username: string, password: string) => Promise<void>;
  signIn: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;

  // Navigation and chrome
  setScreen: (screen: Screen) => void;
  togglePalette: (open?: boolean) => void;

  // Toasts
  toast: (key: TranslationKey, params?: TranslateParams, action?: Toast['action']) => void;
  fail: (error: unknown) => void;
  dismissToast: (id: string) => void;

  // Rules
  setEditingRule: (rule: Rule | null) => void
  saveRule: (rule: Rule) => Promise<void>;
  deleteRule: (id: Uuid) => Promise<void>;
  toggleRule: (id: Uuid) => Promise<void>;
  duplicateRule: (id: Uuid) => Promise<void>;
  reorderRules: (ids: Uuid[]) => Promise<void>;
  exportRules: () => Promise<void>;
  importRules: (replace: boolean) => Promise<void>;

  // Folders
  addFolder: () => Promise<void>;
  removeFolder: (id: Uuid) => Promise<void>;
  toggleFolder: (id: Uuid) => Promise<void>;
  setFolderRecursive: (id: Uuid, recursive: boolean) => Promise<void>;

  // Settings
  patchConfig: (patch: Partial<AppConfig>) => Promise<void>;

  // Organizing
  organize: (folderPath?: string | null) => Promise<void>;
  /** Apply one rule on its own, ignoring the rest of the list. */
  organizeRule: (rule: Rule) => Promise<void>;
  /** Add a folder by path, for files dropped onto the window. */
  addFolderByPath: (path: string) => Promise<void>;
  closeReview: () => void;
  toggleReviewItem: (id: Uuid) => void;
  setAllReviewItems: (selected: boolean) => void;
  applyReview: () => Promise<void>;

  // Activity
  undo: (id: Uuid) => Promise<void>;
  undoBatch: (batchId: Uuid) => Promise<void>;
  clearActivity: () => Promise<void>;
}

const message = (error: unknown) =>
  error instanceof Error ? error.message : typeof error === 'string' ? error : '';

/** Summarises a report as a key and its numbers, for the toast to translate. */
function describeReport(report: ExecutionReport): { key: TranslationKey; params: TranslateParams } {
  const done = report.entries.length;
  const failed = report.failures.length;

  if (done === 0 && failed === 0) return { key: 'toast.nothingToDo', params: {} };
  if (failed > 0) return { key: 'toast.organizedWithFailures', params: { count: done, failed } };
  return { key: 'toast.organized', params: { count: done } };
}

type Set = (partial: Partial<AppState>) => void;
type Get = () => AppState;

/** Guards the event subscriptions, which must only ever be wired up once. */
let listening = false;

/**
 * Loads everything the app shows once the session is unlocked. Called from
 * `init` when there is no lock to pass, and from `signIn` once one is passed.
 */
async function loadUnlockedState(set: Set, get: Get): Promise<void> {
  // Settings and rules are the app; without them there is nothing to show.
  const [config, rules] = await Promise.all([ipc.getSettings(), ipc.getRules()]);

  // The rest is supporting detail. A corrupt journal shouldn't cost the user
  // access to their rules, so these are allowed to come back empty.
  const [activity, paths, about] = await Promise.all([
    ipc.getActivity(200).catch(() => []),
    ipc.getAppPaths().catch(() => null),
    ipc.getAbout().catch(() => null),
  ]);

  set({
    config,
    rules,
    activity,
    paths,
    about,
    folders: config.watched_folders,
    ready: true,
    loadError: null,
  });

  void get().refreshStats();

  if (listening) return;
  listening = true;

  // The watcher and the tray can both organize files without the window being
  // involved, so keep listening rather than polling.
  await ipc.onActivity((report) => {
    const { toast, refreshActivity, refreshStats, account } = get();
    // Nothing is fetched while locked; the tray keeps working regardless.
    if (account?.exists && !account.unlocked) return;

    void refreshActivity();
    void refreshStats();
    if (report.entries.length > 0 || report.failures.length > 0) {
      const summary = describeReport(report);
      toast(summary.key, summary.params, {
        labelKey: 'common.undo',
        run: () => void get().undoBatch(report.batch_id),
      });
    }
  });

  await ipc.onSettings((next) => {
    set({ config: next, folders: next.watched_folders });
    void get().refreshStats();
  });
}

export const useApp = create<AppState>((set, get) => ({
  ready: false,
  preview: !ipc.isTauri,
  loadError: null,

  account: null,
  minPasswordLength: 8,

  config: null,
  rules: [],
  folders: [],
  activity: [],
  stats: null,
  paths: null,
  about: null,

  screen: 'rules',
  editingRule: null,
  review: null,
  reviewBusy: false,
  paletteOpen: false,
  busy: false,
  toasts: [],

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  init: async () => {
    try {
      // The account comes first: while the app is locked the backend refuses
      // every data command, so asking for rules would only produce an error.
      const [account, minLength] = await Promise.all([
        ipc.getAccount(),
        ipc.minPasswordLength().catch(() => 8),
      ]);
      set({ account, minPasswordLength: minLength });

      if (account.exists && !account.unlocked) {
        // Settings stay readable so the lock screen honours the chosen theme.
        const config = await ipc.getSettings().catch(() => null);
        set({ config, ready: true, loadError: null });
        return;
      }

      await loadUnlockedState(set, get);
    } catch (error) {
      set({ ready: true, loadError: message(error) });
    }
  },

  // -----------------------------------------------------------------------
  // Account
  // -----------------------------------------------------------------------

  createAccount: async (username, password) => {
    const account = await ipc.createAccount(username, password);
    set({ account });
    get().toast('toast.accountCreated', { name: account.username ?? '' });
  },

  signIn: async (password) => {
    const account = await ipc.signIn(password);
    set({ account });
    // Everything was withheld while locked, so fetch it now.
    await loadUnlockedState(set, get);
  },

  signOut: async () => {
    try {
      const account = await ipc.signOut();
      // Drop the data from memory along with the session — leaving rules in the
      // store would let the next person read them off the lock screen.
      set({
        account,
        rules: [],
        folders: [],
        activity: [],
        stats: null,
        paths: null,
        editingRule: null,
        review: null,
        paletteOpen: false,
        screen: 'rules',
      });
    } catch (error) {
      get().fail(error);
    }
  },

  changePassword: async (current, next) => {
    const account = await ipc.changePassword(current, next);
    set({ account });
    get().toast('toast.passwordChanged');
  },

  deleteAccount: async (password) => {
    const account = await ipc.deleteAccount(password);
    set({ account });
    get().toast('toast.accountRemoved');
  },

  refreshStats: async () => {
    try {
      set({ stats: await ipc.getStats() });
    } catch {
      // Stats are decoration; a failure here shouldn't interrupt anything.
    }
  },

  refreshActivity: async () => {
    try {
      set({ activity: await ipc.getActivity(200) });
    } catch (error) {
      get().fail(error);
    }
  },

  // -----------------------------------------------------------------------
  // Navigation and chrome
  // -----------------------------------------------------------------------

  setScreen: (screen) => set({ screen }),
  togglePalette: (open) => set((s) => ({ paletteOpen: open ?? !s.paletteOpen })),

  // -----------------------------------------------------------------------
  // Toasts
  // -----------------------------------------------------------------------

  toast: (key, params, action) =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        { id: crypto.randomUUID(), tone: 'neutral' as const, key, params, action },
      ].slice(-3),
    })),

  fail: (error) =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        {
          id: crypto.randomUUID(),
          tone: 'error' as const,
          // A backend error is already a sentence; anything else gets a generic key.
          ...(message(error) ? { text: message(error) } : { key: 'toast.somethingWrong' as const }),
        },
      ].slice(-3),
    })),

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  // -----------------------------------------------------------------------
  // Rules
  // -----------------------------------------------------------------------

  setEditingRule: (rule) => set({ editingRule: rule }),

  saveRule: async (rule) => {
    try {
      set({ rules: await ipc.saveRule(rule), editingRule: null });
      void get().refreshStats();
      if (rule.name) get().toast('toast.saved', { name: rule.name });
      else get().toast('toast.savedUnnamed');
    } catch (error) {
      get().fail(error);
    }
  },

  deleteRule: async (id) => {
    const removed = get().rules.find((r) => r.id === id);
    try {
      set({ rules: await ipc.deleteRule(id), editingRule: null });
      void get().refreshStats();
      if (removed?.name) get().toast('toast.deleted', { name: removed.name });
      else get().toast('toast.deletedUnnamed');
    } catch (error) {
      get().fail(error);
    }
  },

  toggleRule: async (id) => {
    try {
      set({ rules: await ipc.toggleRule(id) });
      void get().refreshStats();
    } catch (error) {
      get().fail(error);
    }
  },

  duplicateRule: async (id) => {
    try {
      set({ rules: await ipc.duplicateRule(id) });
      void get().refreshStats();
      get().toast('toast.duplicated');
    } catch (error) {
      get().fail(error);
    }
  },

  reorderRules: async (ids) => {
    // Reorder locally first so dragging doesn't wait on a round trip.
    const byId = new Map(get().rules.map((r) => [r.id, r]));
    const optimistic = ids
      .map((id, order) => {
        const rule = byId.get(id);
        return rule ? { ...rule, order } : null;
      })
      .filter((r): r is Rule => r !== null);
    set({ rules: optimistic });

    try {
      set({ rules: await ipc.reorderRules(ids) });
    } catch (error) {
      get().fail(error);
      set({ rules: await ipc.getRules() });
    }
  },

  exportRules: async () => {
    try {
      const path = await ipc.exportRules();
      if (path) get().toast('toast.exported', { path });
    } catch (error) {
      get().fail(error);
    }
  },

  importRules: async (replace) => {
    try {
      const rules = await ipc.importRules(replace);
      if (!rules) return;
      set({ rules });
      void get().refreshStats();
      get().toast('toast.imported', { count: rules.length });
    } catch (error) {
      get().fail(error);
    }
  },

  // -----------------------------------------------------------------------
  // Folders
  // -----------------------------------------------------------------------

  addFolder: async () => {
    try {
      const path = await ipc.pickFolder();
      if (!path) return;
      const folders = await ipc.addWatchedFolder(path);
      set({ folders, config: get().config ? { ...get().config!, watched_folders: folders } : null });
      void get().refreshStats();
      get().toast('toast.watching', { path });
    } catch (error) {
      get().fail(error);
    }
  },

  removeFolder: async (id) => {
    try {
      const folders = await ipc.removeWatchedFolder(id);
      set({ folders, config: get().config ? { ...get().config!, watched_folders: folders } : null });
      void get().refreshStats();
    } catch (error) {
      get().fail(error);
    }
  },

  toggleFolder: async (id) => {
    try {
      const folders = await ipc.toggleWatchedFolder(id);
      set({ folders, config: get().config ? { ...get().config!, watched_folders: folders } : null });
      void get().refreshStats();
    } catch (error) {
      get().fail(error);
    }
  },

  setFolderRecursive: async (id, recursive) => {
    try {
      const folders = await ipc.setFolderRecursive(id, recursive);
      set({ folders, config: get().config ? { ...get().config!, watched_folders: folders } : null });
      void get().refreshStats();
    } catch (error) {
      get().fail(error);
    }
  },

  // -----------------------------------------------------------------------
  // Settings
  // -----------------------------------------------------------------------

  patchConfig: async (patch) => {
    const current = get().config;
    if (!current) return;

    const next = { ...current, ...patch };
    // Apply immediately — a settings toggle that lags feels broken.
    set({ config: next });

    try {
      const saved = await ipc.updateSettings(next);
      set({ config: saved, folders: saved.watched_folders });
      void get().refreshStats();
    } catch (error) {
      set({ config: current });
      get().fail(error);
    }
  },

  // -----------------------------------------------------------------------
  // Organizing
  // -----------------------------------------------------------------------

  organize: async (folderPath) => {
    const config = get().config;
    set({ busy: true });
    try {
      if (config?.confirm_before_apply) {
        const planned = await ipc.dryRun(folderPath);
        if (planned.length === 0) {
          get().toast('toast.nothingToDo');
          return;
        }
        set({ review: planned });
        return;
      }

      const report = folderPath
        ? await ipc.applyOperations(await ipc.dryRun(folderPath))
        : await ipc.organizeNow();
      await get().refreshActivity();
      void get().refreshStats();
      const summary = describeReport(report);
      get().toast(summary.key, summary.params, {
        labelKey: 'common.undo',
        run: () => void get().undoBatch(report.batch_id),
      });
    } catch (error) {
      get().fail(error);
    } finally {
      set({ busy: false });
    }
  },

  organizeRule: async (rule) => {
    const config = get().config;
    set({ busy: true });
    try {
      // preview_rule plans this rule alone against the watched folders — the
      // same call the editor uses for its live count, so what you saw is what
      // runs.
      const planned = await ipc.previewRule(rule);
      if (planned.length === 0) {
        get().toast('toast.ruleNothing', { name: rule.name });
        return;
      }

      if (config?.confirm_before_apply) {
        set({ review: planned });
        return;
      }

      const report = await ipc.applyOperations(planned);
      await get().refreshActivity();
      void get().refreshStats();
      const summary = describeReport(report);
      get().toast(summary.key, summary.params, {
        labelKey: 'common.undo',
        run: () => void get().undoBatch(report.batch_id),
      });
    } catch (error) {
      get().fail(error);
    } finally {
      set({ busy: false });
    }
  },

  addFolderByPath: async (path) => {
    try {
      const folders = await ipc.addWatchedFolder(path);
      set({ folders, config: get().config ? { ...get().config!, watched_folders: folders } : null });
      void get().refreshStats();
      get().toast('toast.watching', { path });
    } catch (error) {
      get().fail(error);
    }
  },

  closeReview: () => set({ review: null, busy: false }),

  toggleReviewItem: (id) =>
    set((s) => ({
      review: s.review?.map((op) => (op.id === id ? { ...op, selected: !op.selected } : op)) ?? null,
    })),

  setAllReviewItems: (selected) =>
    set((s) => ({ review: s.review?.map((op) => ({ ...op, selected })) ?? null })),

  applyReview: async () => {
    const review = get().review;
    if (!review) return;

    set({ reviewBusy: true });
    try {
      const report = await ipc.applyOperations(review);
      set({ review: null });
      await get().refreshActivity();
      void get().refreshStats();
      const summary = describeReport(report);
      get().toast(summary.key, summary.params, {
        labelKey: 'common.undo',
        run: () => void get().undoBatch(report.batch_id),
      });
      for (const failure of report.failures.slice(0, 2)) {
        get().fail(`${failure.source}: ${failure.error}`);
      }
    } catch (error) {
      get().fail(error);
    } finally {
      set({ reviewBusy: false, busy: false });
    }
  },

  // -----------------------------------------------------------------------
  // Activity
  // -----------------------------------------------------------------------

  undo: async (id) => {
    try {
      await ipc.undoOperation(id);
      await get().refreshActivity();
      void get().refreshStats();
      get().toast('toast.reverted');
    } catch (error) {
      get().fail(error);
    }
  },

  undoBatch: async (batchId) => {
    try {
      const count = await ipc.undoBatch(batchId);
      await get().refreshActivity();
      void get().refreshStats();
      get().toast('toast.revertedBatch', { count });
    } catch (error) {
      get().fail(error);
    }
  },

  clearActivity: async () => {
    try {
      await ipc.clearActivity();
      set({ activity: [] });
      void get().refreshStats();
      get().toast('toast.historyCleared');
    } catch (error) {
      get().fail(error);
    }
  },
}));
