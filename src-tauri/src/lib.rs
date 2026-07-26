// Perch library root.

pub mod cli;
pub mod commands;
pub mod core;
pub mod platform;
pub mod runtime;

use std::sync::Arc;
use std::time::Duration;

use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Manager, WindowEvent};
use tauri_plugin_autostart::MacosLauncher;

use commands::*;
use core::store::AppState;
use core::watcher::FolderWatcher;
use runtime::Runtime;

pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--autostart"]),
        ))
        .setup(|app| {
            let state = Arc::new(AppState::load()?);
            let config = state.config();
            app.manage(Arc::clone(&state));

            // The watcher hands batches of touched files to the organizer.
            let handle = app.handle().clone();
            let watcher = FolderWatcher::start(
                Duration::from_secs(config.debounce_secs.clamp(1, 3600)),
                Arc::new(move |files| {
                    let state = handle.state::<Arc<AppState>>();
                    let config = state.config();
                    if !config.auto_organize || runtime::is_quiet_now(&config) {
                        return;
                    }
                    let report = runtime::organize_files(&handle, files);
                    if !report.entries.is_empty() {
                        log::info!("auto-organized {} file(s)", report.entries.len());
                    }
                }),
            );
            app.manage(Runtime { watcher });

            let runtime_state = app.state::<Runtime>();
            runtime::sync_watcher(&state, &runtime_state);
            if let Err(e) = runtime::apply_autostart(app.handle(), config.autostart) {
                log::warn!("{e}");
            }

            if config.tray_icon {
                build_tray(app.handle())?;
            }

            // Closing the window parks Perch in the tray rather than quitting,
            // so watched folders keep being organized.
            if let Some(window) = app.get_webview_window("main") {
                let handle = app.handle().clone();
                window.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        let state = handle.state::<Arc<AppState>>();
                        let config = state.config();
                        if config.tray_icon && config.minimize_to_tray {
                            api.prevent_close();
                            if let Some(window) = handle.get_webview_window("main") {
                                let _ = window.hide();
                            }
                        }
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // rules
            get_rules,
            save_rule,
            delete_rule,
            toggle_rule,
            duplicate_rule,
            reorder_rules,
            // folders
            get_watched_folders,
            add_watched_folder,
            remove_watched_folder,
            toggle_watched_folder,
            set_folder_recursive,
            pick_folder,
            // planning
            dry_run,
            apply_operations,
            organize_now,
            preview_rule,
            validate_template,
            scan_folder,
            // activity
            get_activity,
            undo_operation,
            undo_batch,
            clear_activity,
            // settings
            get_settings,
            update_settings,
            set_auto_organize,
            get_app_paths,
            get_stats,
            export_rules,
            import_rules,
            reveal_path,
            // account
            get_account,
            min_password_length,
            create_account,
            sign_in,
            sign_out,
            change_password,
            delete_account,
            // window / misc
            quit_app,
            hide_to_tray,
            get_about,
            ping,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Perch");
}

/// Tray icon with a small menu. Left-clicking the icon brings the window back.
fn build_tray(app: &tauri::AppHandle) -> tauri::Result<()> {
    let show = MenuItem::with_id(app, "show", "Open Perch", true, None::<&str>)?;
    let organize = MenuItem::with_id(app, "organize", "Organize now", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &organize, &separator, &quit])?;

    TrayIconBuilder::with_id("perch-tray")
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("Perch")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => show_main_window(app),
            "organize" => {
                let app = app.clone();
                std::thread::spawn(move || {
                    let state = app.state::<Arc<AppState>>();
                    let files = runtime::collect_watched_files(&state);
                    runtime::organize_files(&app, files);
                });
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}
