// Application configuration model.

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use uuid::Uuid;

/// Application-level configuration.
///
/// Every field carries a `serde` default so that a config file written by an
/// older build still loads after new settings are introduced.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct AppConfig {
    pub watched_folders: Vec<WatchedFolder>,
    pub quiet_hours: Option<QuietHours>,
    pub theme: Theme,
    pub accent: Accent,
    pub autostart: bool,
    pub language: String,
    /// Apply matching rules automatically when a watched folder changes.
    pub auto_organize: bool,
    /// Seconds to wait after the last file event before organizing.
    pub debounce_secs: u64,
    /// Keep a tray icon and hide to tray instead of quitting.
    pub tray_icon: bool,
    pub minimize_to_tray: bool,
    /// Skip dot-files when scanning.
    pub skip_hidden: bool,
    /// Show the dry-run review sheet before applying operations.
    pub confirm_before_apply: bool,
    /// Reduce motion / transparency for lower-end machines.
    pub reduced_motion: bool,
    pub glass_intensity: GlassIntensity,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            watched_folders: Vec::new(),
            quiet_hours: None,
            theme: Theme::Dark,
            // Mono is white — the interface stays monochrome unless asked.
            accent: Accent::Mono,
            autostart: false,
            language: "ru".to_string(),
            auto_organize: false,
            debounce_secs: 5,
            tray_icon: true,
            minimize_to_tray: true,
            skip_hidden: true,
            confirm_before_apply: true,
            reduced_motion: false,
            glass_intensity: GlassIntensity::Medium,
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

/// Quiet hours configuration — no automatic organizing inside this window.
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct QuietHours {
    pub start_hour: u8,
    pub start_minute: u8,
    pub end_hour: u8,
    pub end_minute: u8,
}

impl QuietHours {
    /// Is `minutes_of_day` inside the quiet window? Handles windows that wrap
    /// past midnight (e.g. 22:00 → 08:00).
    pub fn contains(&self, minutes_of_day: u32) -> bool {
        let start = self.start_hour as u32 * 60 + self.start_minute as u32;
        let end = self.end_hour as u32 * 60 + self.end_minute as u32;
        if start == end {
            false
        } else if start < end {
            minutes_of_day >= start && minutes_of_day < end
        } else {
            minutes_of_day >= start || minutes_of_day < end
        }
    }
}

/// UI theme setting.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Theme {
    Dark,
    Light,
    Auto,
}

/// Accent tint applied to the glass material.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Accent {
    Mono,
    Blue,
    Violet,
    Green,
    Amber,
}

/// How heavy the glass blur is.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum GlassIntensity {
    Off,
    Light,
    Medium,
    Heavy,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn quiet_hours_same_day_window() {
        let q = QuietHours { start_hour: 9, start_minute: 0, end_hour: 17, end_minute: 0 };
        assert!(q.contains(10 * 60));
        assert!(!q.contains(8 * 60));
        assert!(!q.contains(17 * 60));
    }

    #[test]
    fn quiet_hours_wrapping_window() {
        let q = QuietHours { start_hour: 22, start_minute: 0, end_hour: 8, end_minute: 0 };
        assert!(q.contains(23 * 60));
        assert!(q.contains(2 * 60));
        assert!(!q.contains(12 * 60));
    }

    #[test]
    fn config_roundtrips_with_missing_fields() {
        let json = r#"{"theme":"light","autostart":true}"#;
        let cfg: AppConfig = serde_json::from_str(json).unwrap();
        assert_eq!(cfg.theme, Theme::Light);
        assert!(cfg.autostart);
        // Defaults filled in for everything else.
        assert!(cfg.skip_hidden);
        assert_eq!(cfg.debounce_secs, 5);
    }
}
