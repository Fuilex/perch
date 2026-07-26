// Glue between the persisted state and the things that actually run:
// the folder watcher, autostart registration, and automatic organizing.

use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use chrono::{Local, Timelike};
use tauri::{AppHandle, Emitter, Manager};

use crate::core::config::AppConfig;
use crate::core::executor::{self, ExecutionReport};
use crate::core::planner;
use crate::core::store::AppState;
use crate::core::watcher::FolderWatcher;

/// Long-lived runtime pieces, kept in Tauri's managed state next to `AppState`.
pub struct Runtime {
    pub watcher: Arc<FolderWatcher>,
}

/// Event names the frontend listens for.
pub const EVENT_ACTIVITY: &str = "perch://activity";
pub const EVENT_SETTINGS: &str = "perch://settings";

/// Point the watcher at the currently enabled folders. Called at startup and
/// whenever folders or automation settings change.
pub fn sync_watcher(state: &AppState, runtime: &Runtime) {
    let config = state.config();
    runtime
        .watcher
        .set_debounce(Duration::from_secs(config.debounce_secs.clamp(1, 3600)));

    if config.auto_organize {
        if let Err(e) = runtime.watcher.watch(&config.watched_folders) {
            log::error!("watcher: {e}");
        }
    } else {
        runtime.watcher.stop();
    }
}

/// Is the current local time inside the user's quiet window?
pub fn is_quiet_now(config: &AppConfig) -> bool {
    let Some(quiet) = config.quiet_hours else {
        return false;
    };
    let now = Local::now();
    quiet.contains(now.hour() * 60 + now.minute())
}

/// Plan and apply rules over a concrete set of files. Used by the watcher and
/// by the "Organize now" button.
pub fn organize_files(app: &AppHandle, files: Vec<PathBuf>) -> ExecutionReport {
    let state = app.state::<Arc<AppState>>();
    let rules = state.rules();
    let operations = planner::plan(&files, &rules);
    let report = executor::execute(&operations, &state.journal);

    if !report.entries.is_empty() || !report.failures.is_empty() {
        let _ = app.emit(EVENT_ACTIVITY, &report);
    }
    report
}

/// Every file inside the enabled watched folders.
pub fn collect_watched_files(state: &AppState) -> Vec<PathBuf> {
    let config = state.config();
    let mut files = Vec::new();
    for folder in config.watched_folders.iter().filter(|f| f.enabled) {
        let depth = if folder.recursive { None } else { Some(0) };
        files.extend(crate::core::scanner::scan_folder(
            &folder.path,
            depth,
            config.skip_hidden,
        ));
    }
    files
}

/// Register or unregister the app with the OS login items.
pub fn apply_autostart(app: &AppHandle, enabled: bool) -> Result<(), String> {
    use tauri_plugin_autostart::ManagerExt;

    let manager = app.autolaunch();
    let result = if enabled {
        manager.enable()
    } else {
        manager.disable()
    };
    result.map_err(|e| format!("could not update autostart: {e}"))
}

/// Called whenever settings are written: keeps the OS-level side effects in
/// sync with what the user selected in the UI.
pub fn apply_config_side_effects(app: &AppHandle, config: &AppConfig) {
    if let Err(e) = apply_autostart(app, config.autostart) {
        log::warn!("{e}");
    }

    let state = app.state::<Arc<AppState>>();
    let runtime = app.state::<Runtime>();
    sync_watcher(&state, &runtime);

    let _ = app.emit(EVENT_SETTINGS, config);
}
