// Tauri command handlers.
//
// Thin wrappers around `core`: parse arguments, touch shared state, persist,
// and hand a serialisable result back to the UI. Everything the UI needs to
// configure Perch is reachable from here — there is no config file to edit by
// hand.

use std::path::PathBuf;
use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State};
use tauri_plugin_dialog::{DialogExt, FilePath};
use uuid::Uuid;

use crate::core::account::{AccountState, MIN_PASSWORD_LEN};
use crate::core::config::{AppConfig, WatchedFolder};
use crate::core::executor::{self, ExecutionReport};
use crate::core::journal::JournalEntry;
use crate::core::rule::{PlannedOperation, Rule};
use crate::core::store::AppState;
use crate::core::{planner, scanner, template};
use crate::runtime::{self, Runtime};

type Res<T> = Result<T, String>;

/// Shorthand for the managed state tuple most commands need.
type Db<'a> = State<'a, Arc<AppState>>;

fn parse_id(id: &str) -> Res<Uuid> {
    Uuid::parse_str(id).map_err(|_| format!("'{id}' is not a valid id"))
}

/// Refuses when the app is locked. Applied to every command that reads or
/// changes the user's rules, folders, files or history — the lock screen in the
/// UI is the polite half of this, and this is the half that actually holds.
fn gate(state: &AppState) -> Res<()> {
    state.require_unlocked()
}

fn to_path(file: FilePath) -> Option<PathBuf> {
    file.into_path().ok()
}

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn get_rules(state: Db<'_>) -> Res<Vec<Rule>> {
    gate(&state)?;
    Ok(state.rules())
}

/// Create or update a rule — whichever the id calls for.
#[tauri::command]
pub fn save_rule(state: Db<'_>, rule: Rule) -> Res<Vec<Rule>> {
    gate(&state)?;
    state.update_rules(|rules| {
        match rules.iter_mut().find(|r| r.id == rule.id) {
            Some(existing) => *existing = rule,
            None => {
                let mut rule = rule;
                rule.order = rules.len() as i32;
                rules.push(rule);
            }
        }
        rules.sort_by_key(|r| r.order);
        rules.clone()
    })
}

#[tauri::command]
pub fn delete_rule(state: Db<'_>, id: String) -> Res<Vec<Rule>> {
    gate(&state)?;
    let id = parse_id(&id)?;
    state.update_rules(|rules| {
        rules.retain(|r| r.id != id);
        for (i, rule) in rules.iter_mut().enumerate() {
            rule.order = i as i32;
        }
        rules.clone()
    })
}

#[tauri::command]
pub fn toggle_rule(state: Db<'_>, id: String) -> Res<Vec<Rule>> {
    gate(&state)?;
    let id = parse_id(&id)?;
    state.update_rules(|rules| {
        if let Some(rule) = rules.iter_mut().find(|r| r.id == id) {
            rule.enabled = !rule.enabled;
        }
        rules.clone()
    })
}

#[tauri::command]
pub fn duplicate_rule(state: Db<'_>, id: String) -> Res<Vec<Rule>> {
    gate(&state)?;
    let id = parse_id(&id)?;
    state.update_rules(|rules| {
        if let Some(original) = rules.iter().find(|r| r.id == id).cloned() {
            let mut copy = original;
            copy.id = Uuid::new_v4();
            copy.name = format!("{} copy", copy.name);
            copy.order = rules.len() as i32;
            rules.push(copy);
        }
        rules.clone()
    })
}

#[tauri::command]
pub fn reorder_rules(state: Db<'_>, ids: Vec<String>) -> Res<Vec<Rule>> {
    gate(&state)?;
    let order: Vec<Uuid> = ids.iter().filter_map(|id| Uuid::parse_str(id).ok()).collect();
    state.update_rules(|rules| {
        for rule in rules.iter_mut() {
            if let Some(index) = order.iter().position(|id| id == &rule.id) {
                rule.order = index as i32;
            }
        }
        rules.sort_by_key(|r| r.order);
        rules.clone()
    })
}

// ---------------------------------------------------------------------------
// Watched folders
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn get_watched_folders(state: Db<'_>) -> Res<Vec<WatchedFolder>> {
    gate(&state)?;
    Ok(state.config().watched_folders)
}

#[tauri::command]
pub fn add_watched_folder(app: AppHandle, state: Db<'_>, path: String) -> Res<Vec<WatchedFolder>> {
    gate(&state)?;
    let path = template::expand_home(&path);
    if !path.is_dir() {
        return Err(format!("{} is not a folder", path.display()));
    }
    let config = state.update_config(|cfg| {
        let already_there = cfg
            .watched_folders
            .iter()
            .any(|f| f.path == path);
        if !already_there {
            cfg.watched_folders.push(WatchedFolder::new(path.clone()));
        }
    })?;
    runtime::apply_config_side_effects(&app, &config);
    Ok(config.watched_folders)
}

#[tauri::command]
pub fn remove_watched_folder(app: AppHandle, state: Db<'_>, id: String) -> Res<Vec<WatchedFolder>> {
    gate(&state)?;
    let id = parse_id(&id)?;
    let config = state.update_config(|cfg| cfg.watched_folders.retain(|f| f.id != id))?;
    runtime::apply_config_side_effects(&app, &config);
    Ok(config.watched_folders)
}

#[tauri::command]
pub fn toggle_watched_folder(app: AppHandle, state: Db<'_>, id: String) -> Res<Vec<WatchedFolder>> {
    gate(&state)?;
    let id = parse_id(&id)?;
    let config = state.update_config(|cfg| {
        if let Some(folder) = cfg.watched_folders.iter_mut().find(|f| f.id == id) {
            folder.enabled = !folder.enabled;
        }
    })?;
    runtime::apply_config_side_effects(&app, &config);
    Ok(config.watched_folders)
}

#[tauri::command]
pub fn set_folder_recursive(
    app: AppHandle,
    state: Db<'_>,
    id: String,
    recursive: bool,
) -> Res<Vec<WatchedFolder>> {
    gate(&state)?;
    let id = parse_id(&id)?;
    let config = state.update_config(|cfg| {
        if let Some(folder) = cfg.watched_folders.iter_mut().find(|f| f.id == id) {
            folder.recursive = recursive;
        }
    })?;
    runtime::apply_config_side_effects(&app, &config);
    Ok(config.watched_folders)
}

/// Native folder picker. Runs off the main thread — a blocking dialog on the
/// main thread would deadlock the event loop.
#[tauri::command(async)]
pub fn pick_folder(app: AppHandle, state: Db<'_>) -> Res<Option<String>> {
    gate(&state)?;
    let picked = app.dialog().file().blocking_pick_folder();
    Ok(picked
        .and_then(to_path)
        .map(|p| p.to_string_lossy().to_string()))
}

// ---------------------------------------------------------------------------
// Planning and applying
// ---------------------------------------------------------------------------

#[tauri::command(async)]
pub fn dry_run(state: Db<'_>, folder_path: Option<String>) -> Res<Vec<PlannedOperation>> {
    gate(&state)?;
    let config = state.config();
    let files = match folder_path {
        Some(path) => {
            let path = template::expand_home(&path);
            if !path.is_dir() {
                return Err(format!("{} is not a folder", path.display()));
            }
            scanner::scan_folder(&path, None, config.skip_hidden)
        }
        None => runtime::collect_watched_files(&state),
    };
    Ok(planner::plan(&files, &state.rules()))
}

#[tauri::command(async)]
pub fn apply_operations(
    app: AppHandle,
    state: Db<'_>,
    operations: Vec<PlannedOperation>,
) -> Res<ExecutionReport> {
    gate(&state)?;
    let report = executor::execute(&operations, &state.journal);
    let _ = tauri::Emitter::emit(&app, runtime::EVENT_ACTIVITY, &report);
    Ok(report)
}

/// Scan every watched folder and apply whatever matches, in one go.
#[tauri::command(async)]
pub fn organize_now(app: AppHandle, state: Db<'_>) -> Res<ExecutionReport> {
    gate(&state)?;
    let files = runtime::collect_watched_files(&state);
    Ok(runtime::organize_files(&app, files))
}

/// Count what a rule would touch, without changing anything. Powers the live
/// "matches N files" hint in the rule editor.
#[tauri::command(async)]
pub fn preview_rule(
    state: Db<'_>,
    rule: Rule,
    folder_path: Option<String>,
) -> Res<Vec<PlannedOperation>> {
    gate(&state)?;
    let config = state.config();
    let files = match folder_path {
        Some(path) => scanner::scan_folder(&template::expand_home(&path), None, config.skip_hidden),
        None => runtime::collect_watched_files(&state),
    };
    let mut rule = rule;
    rule.enabled = true;
    Ok(planner::plan(&files, std::slice::from_ref(&rule)))
}

/// Returns the unknown `{variables}` in a template — empty means it's valid.
#[tauri::command]
pub fn validate_template(template_string: String) -> Res<Vec<String>> {
    match template::validate_template(&template_string) {
        Ok(()) => Ok(Vec::new()),
        Err(unknown) => Ok(unknown),
    }
}

#[tauri::command(async)]
pub fn scan_folder(state: Db<'_>, path: String) -> Res<Vec<String>> {
    gate(&state)?;
    let path = template::expand_home(&path);
    let files = scanner::scan_folder(&path, None, state.config().skip_hidden);
    Ok(files.iter().map(|p| p.to_string_lossy().to_string()).collect())
}

// ---------------------------------------------------------------------------
// Activity / undo
// ---------------------------------------------------------------------------

/// A journal entry plus the human-readable rule name for display.
#[derive(Debug, Clone, Serialize)]
pub struct ActivityEntry {
    #[serde(flatten)]
    pub entry: JournalEntry,
    pub rule_name: String,
}

#[tauri::command]
pub fn get_activity(state: Db<'_>, limit: Option<usize>) -> Res<Vec<ActivityEntry>> {
    gate(&state)?;
    let entries = state
        .journal
        .get_all(limit.unwrap_or(200))
        .map_err(|e| e.to_string())?;
    Ok(entries
        .into_iter()
        .map(|entry| ActivityEntry {
            rule_name: state.rule_name(&entry.rule_id),
            entry,
        })
        .collect())
}

#[tauri::command(async)]
pub fn undo_operation(state: Db<'_>, id: String) -> Res<()> {
    gate(&state)?;
    let id = parse_id(&id)?;
    let entry = state
        .journal
        .get(&id)
        .map_err(|e| e.to_string())?
        .ok_or("That operation is no longer in the history")?;
    executor::undo(&entry)?;
    state.journal.mark_undone(&id).map_err(|e| e.to_string())
}

#[tauri::command(async)]
pub fn undo_batch(state: Db<'_>, batch_id: String) -> Res<usize> {
    gate(&state)?;
    let batch_id = parse_id(&batch_id)?;
    let entries = state
        .journal
        .get_batch(&batch_id)
        .map_err(|e| e.to_string())?;

    let mut undone = 0usize;
    let mut last_error = None;
    for entry in entries.iter().filter(|e| !e.undone) {
        match executor::undo(entry) {
            Ok(()) => {
                let _ = state.journal.mark_undone(&entry.id);
                undone += 1;
            }
            Err(e) => last_error = Some(e),
        }
    }

    if undone == 0 {
        return Err(last_error.unwrap_or_else(|| "Nothing left to undo".to_string()));
    }
    Ok(undone)
}

#[tauri::command]
pub fn clear_activity(state: Db<'_>) -> Res<()> {
    gate(&state)?;
    state.journal.clear().map(|_| ()).map_err(|e| e.to_string())
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn get_settings(state: Db<'_>) -> Res<AppConfig> {
    Ok(state.config())
}

#[tauri::command]
pub fn update_settings(app: AppHandle, state: Db<'_>, config: AppConfig) -> Res<AppConfig> {
    gate(&state)?;
    let saved = state.set_config(config)?;
    runtime::apply_config_side_effects(&app, &saved);
    Ok(saved)
}

/// Where Perch keeps its files — shown in Settings so nothing is hidden.
#[derive(Serialize)]
pub struct AppPaths {
    pub root: String,
    pub config: String,
    pub rules: String,
    pub journal: String,
}

#[tauri::command]
pub fn get_app_paths(state: Db<'_>) -> Res<AppPaths> {
    gate(&state)?;
    let paths = state.paths();
    Ok(AppPaths {
        root: paths.root.to_string_lossy().to_string(),
        config: paths.config.to_string_lossy().to_string(),
        rules: paths.rules.to_string_lossy().to_string(),
        journal: paths.journal.to_string_lossy().to_string(),
    })
}

#[derive(Serialize)]
pub struct Stats {
    pub rules: usize,
    pub enabled_rules: usize,
    pub folders: usize,
    pub enabled_folders: usize,
    pub watched_files: usize,
    pub operations: i64,
    pub auto_organize: bool,
    pub quiet_now: bool,
}

#[tauri::command(async)]
pub fn get_stats(state: Db<'_>) -> Res<Stats> {
    gate(&state)?;
    let config = state.config();
    let rules = state.rules();
    Ok(Stats {
        rules: rules.len(),
        enabled_rules: rules.iter().filter(|r| r.enabled).count(),
        folders: config.watched_folders.len(),
        enabled_folders: config.watched_folders.iter().filter(|f| f.enabled).count(),
        watched_files: runtime::collect_watched_files(&state).len(),
        operations: state.journal.count().unwrap_or(0),
        quiet_now: runtime::is_quiet_now(&config),
        auto_organize: config.auto_organize,
    })
}

// ---------------------------------------------------------------------------
// Import / export
// ---------------------------------------------------------------------------

#[derive(Serialize, Deserialize)]
struct RuleBundle {
    version: u32,
    rules: Vec<Rule>,
}

#[tauri::command(async)]
pub fn export_rules(app: AppHandle, state: Db<'_>) -> Res<Option<String>> {
    gate(&state)?;
    let Some(target) = app
        .dialog()
        .file()
        .set_title("Export rules")
        .set_file_name("perch-rules.json")
        .add_filter("JSON", &["json"])
        .blocking_save_file()
        .and_then(to_path)
    else {
        return Ok(None);
    };

    let bundle = RuleBundle {
        version: 1,
        rules: state.rules(),
    };
    let text = serde_json::to_string_pretty(&bundle).map_err(|e| e.to_string())?;
    std::fs::write(&target, text).map_err(|e| format!("could not write {}: {e}", target.display()))?;
    Ok(Some(target.to_string_lossy().to_string()))
}

#[tauri::command(async)]
pub fn import_rules(app: AppHandle, state: Db<'_>, replace: bool) -> Res<Option<Vec<Rule>>> {
    gate(&state)?;
    let Some(source) = app
        .dialog()
        .file()
        .set_title("Import rules")
        .add_filter("JSON", &["json"])
        .blocking_pick_file()
        .and_then(to_path)
    else {
        return Ok(None);
    };

    let text = std::fs::read_to_string(&source)
        .map_err(|e| format!("could not read {}: {e}", source.display()))?;

    // Accept both a full bundle and a bare array of rules.
    let imported: Vec<Rule> = match serde_json::from_str::<RuleBundle>(&text) {
        Ok(bundle) => bundle.rules,
        Err(_) => serde_json::from_str(&text)
            .map_err(|e| format!("{} isn't a Perch rules file: {e}", source.display()))?,
    };

    let rules = state.update_rules(|rules| {
        if replace {
            rules.clear();
        }
        for mut rule in imported {
            // Fresh ids keep an import from silently overwriting existing rules.
            rule.id = Uuid::new_v4();
            rule.order = rules.len() as i32;
            rules.push(rule);
        }
        rules.clone()
    })?;
    Ok(Some(rules))
}

/// Reveal a file or folder in the system file manager.
#[tauri::command(async)]
pub fn reveal_path(state: Db<'_>, path: String) -> Res<()> {
    gate(&state)?;
    let path = template::expand_home(&path);
    if !path.exists() {
        return Err(format!("{} no longer exists", path.display()));
    }

    #[cfg(target_os = "windows")]
    let result = if path.is_dir() {
        std::process::Command::new("explorer").arg(&path).spawn()
    } else {
        std::process::Command::new("explorer")
            .arg(format!("/select,{}", path.display()))
            .spawn()
    };

    #[cfg(target_os = "macos")]
    let result = std::process::Command::new("open")
        .args(if path.is_dir() { vec![] } else { vec!["-R"] })
        .arg(&path)
        .spawn();

    #[cfg(target_os = "linux")]
    let result = std::process::Command::new("xdg-open")
        .arg(if path.is_dir() { path.clone() } else {
            path.parent().unwrap_or(&path).to_path_buf()
        })
        .spawn();

    result
        .map(|_| ())
        .map_err(|e| format!("could not open the file manager: {e}"))
}

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------

/// Quit for real, ignoring "minimize to tray".
#[tauri::command]
pub fn quit_app(app: AppHandle) {
    app.exit(0);
}

#[tauri::command]
pub fn hide_to_tray(app: AppHandle) -> Res<()> {
    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Marker so the frontend can tell it's running inside Tauri.
#[tauri::command]
pub fn ping() -> &'static str {
    "perch"
}

/// Runtime info shown on the About screen.
#[derive(Serialize)]
pub struct AboutInfo {
    pub version: String,
    pub platform: &'static str,
}

#[tauri::command]
pub fn get_about(_state: Db<'_>) -> Res<AboutInfo> {
    Ok(AboutInfo {
        version: env!("CARGO_PKG_VERSION").to_string(),
        platform: crate::platform::platform_name(),
    })
}

/// Kept so `Runtime` is reachable for future commands that need the watcher
/// directly (pause/resume from the tray, for example).
#[tauri::command]
pub fn set_auto_organize(app: AppHandle, state: Db<'_>, enabled: bool) -> Res<AppConfig> {
    gate(&state)?;
    let config = state.update_config(|cfg| cfg.auto_organize = enabled)?;
    let runtime = app.state::<Runtime>();
    runtime::sync_watcher(&state, &runtime);
    let _ = tauri::Emitter::emit(&app, runtime::EVENT_SETTINGS, &config);
    Ok(config)
}

// ---------------------------------------------------------------------------
// Account
//
// One local profile, guarding access on this machine. Not a cloud login and not
// encryption — see core/account.rs for what this does and doesn't promise.
// These commands are deliberately outside `gate`: they are how you get in.
// ---------------------------------------------------------------------------

/// Whether an account exists and whether this session is unlocked. Safe to call
/// while locked — it is the first thing the UI asks.
#[tauri::command]
pub fn get_account(state: Db<'_>) -> Res<AccountState> {
    Ok(state.account_state())
}

/// The shortest password `create_account` will accept, so the UI and the backend
/// can't disagree about it.
#[tauri::command]
pub fn min_password_length() -> usize {
    MIN_PASSWORD_LEN
}

#[tauri::command(async)]
pub fn create_account(state: Db<'_>, username: String, password: String) -> Res<AccountState> {
    state.create_account(&username, &password)
}

#[tauri::command(async)]
pub fn sign_in(state: Db<'_>, password: String) -> Res<AccountState> {
    match state.sign_in(&password) {
        Ok(account) => Ok(account),
        Err(e) => {
            // Argon2 already makes each attempt cost something; this makes
            // hammering the command from a script pointlessly slow as well.
            // Safe to block: the command is async, so it is off the main thread.
            std::thread::sleep(std::time::Duration::from_millis(600));
            Err(e)
        }
    }
}

/// Locks the session again. Rules keep running — the watcher belongs to the
/// machine, not to the window.
#[tauri::command]
pub fn sign_out(state: Db<'_>) -> Res<AccountState> {
    Ok(state.sign_out())
}

#[tauri::command(async)]
pub fn change_password(
    state: Db<'_>,
    current_password: String,
    new_password: String,
) -> Res<AccountState> {
    gate(&state)?;
    state.change_password(&current_password, &new_password)?;
    Ok(state.account_state())
}

/// Removes the profile and the lock with it. Rules, folders and history are left
/// alone — this is not "delete my data".
#[tauri::command(async)]
pub fn delete_account(state: Db<'_>, password: String) -> Res<AccountState> {
    gate(&state)?;
    state.delete_account(&password)
}
