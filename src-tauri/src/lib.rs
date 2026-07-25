// Perch library root.

pub mod cli;
pub mod commands;
pub mod core;
pub mod platform;

use commands::*;

pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_rules,
            create_rule,
            update_rule,
            delete_rule,
            reorder_rules,
            dry_run,
            apply_operations,
            undo_operation,
            undo_batch,
            get_activity,
            get_watched_folders,
            add_watched_folder,
            remove_watched_folder,
            get_settings,
            update_settings,
            scan_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Perch");
}
