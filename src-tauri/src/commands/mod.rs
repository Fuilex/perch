// Tauri command handlers.

use crate::core::config::{AppConfig, WatchedFolder};
use crate::core::journal::JournalEntry;
use crate::core::rule::{PlannedOperation, Rule};
use std::path::PathBuf;

#[tauri::command]
pub async fn get_rules() -> Result<Vec<Rule>, String> {
    Ok(Vec::new())
}

#[tauri::command]
pub async fn create_rule(rule: Rule) -> Result<Rule, String> {
    Ok(rule)
}

#[tauri::command]
pub async fn update_rule(rule: Rule) -> Result<Rule, String> {
    Ok(rule)
}

#[tauri::command]
pub async fn delete_rule(_id: String) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub async fn reorder_rules(_ids: Vec<String>) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub async fn dry_run(_folder_path: String) -> Result<Vec<PlannedOperation>, String> {
    Ok(Vec::new())
}

#[tauri::command]
pub async fn apply_operations(_operations: Vec<PlannedOperation>) -> Result<Vec<JournalEntry>, String> {
    Ok(Vec::new())
}

#[tauri::command]
pub async fn undo_operation(_id: String) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub async fn undo_batch(_batch_id: String) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub async fn get_activity(_limit: Option<usize>) -> Result<Vec<JournalEntry>, String> {
    Ok(Vec::new())
}

#[tauri::command]
pub async fn get_watched_folders() -> Result<Vec<WatchedFolder>, String> {
    Ok(Vec::new())
}

#[tauri::command]
pub async fn add_watched_folder(path: String) -> Result<WatchedFolder, String> {
    Ok(WatchedFolder::new(path))
}

#[tauri::command]
pub async fn remove_watched_folder(_id: String) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub async fn get_settings() -> Result<AppConfig, String> {
    Ok(AppConfig::default())
}

#[tauri::command]
pub async fn update_settings(config: AppConfig) -> Result<AppConfig, String> {
    Ok(config)
}

#[tauri::command]
pub async fn scan_folder(path: String) -> Result<Vec<String>, String> {
    let files = crate::core::scanner::scan_folder(&PathBuf::from(&path), None, true);
    Ok(files.iter().map(|p| p.to_string_lossy().to_string()).collect())
}
