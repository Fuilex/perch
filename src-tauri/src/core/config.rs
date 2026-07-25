// Application configuration model.

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use uuid::Uuid;

/// Application-level configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub watched_folders: Vec<WatchedFolder>,
    pub quiet_hours: Option<QuietHours>,
    pub theme: Theme,
    pub autostart: bool,
    pub language: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            watched_folders: Vec::new(),
            quiet_hours: None,
            theme: Theme::Dark,
            autostart: false,
            language: "en".to_string(),
        }
    }
}

/// A folder being watched for changes.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WatchedFolder {
    pub id: Uuid,
    pub path: PathBuf,
    pub enabled: bool,
    pub recursive: bool,
}

impl WatchedFolder {
    pub fn new(path: impl Into<PathBuf>) -> Self {
        Self {
            id: Uuid::new_v4(),
            path: path.into(),
            enabled: true,
            recursive: true,
        }
    }
}

/// Quiet hours configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuietHours {
    pub start_hour: u8,
    pub start_minute: u8,
    pub end_hour: u8,
    pub end_minute: u8,
}

/// UI theme setting.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Theme {
    Dark,
    Light,
    Auto,
}
