// Rule model and serialization.

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use uuid::Uuid;

/// A file organization rule.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rule {
    pub id: Uuid,
    pub name: String,
    pub enabled: bool,
    pub conditions: Vec<Condition>,
    pub action: Action,
    pub stop_on_match: bool,
    pub order: i32,
}

/// Conditions that a file must satisfy.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "value")]
pub enum Condition {
    Extension(String),
    Glob(String),
    Regex(String),
    SizeGreater(u64),
    SizeSmaller(u64),
    OlderThan(i64),
    NewerThan(i64),
    MimeType(String),
    Duplicate,
    MaxDepth(u32),
}

/// Action to perform when a rule matches.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Action {
    Move { dest_template: String },
    Copy { dest_template: String },
    Rename { template: String },
    Trash,
    Unzip { dest_template: String },
    RunCommand { command: String },
}

impl Rule {
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            id: Uuid::new_v4(),
            name: name.into(),
            enabled: true,
            conditions: Vec::new(),
            action: Action::Move {
                dest_template: String::new(),
            },
            stop_on_match: true,
            order: 0,
        }
    }
}

/// A planned file operation (dry-run result).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlannedOperation {
    pub id: Uuid,
    pub source: PathBuf,
    pub destination: Option<PathBuf>,
    pub action_type: ActionType,
    pub rule_id: Uuid,
    pub rule_name: String,
    pub selected: bool,
}

/// Simplified action type for UI display.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ActionType {
    Move,
    Copy,
    Rename,
    Trash,
    Unzip,
    RunCommand,
}

impl From<&Action> for ActionType {
    fn from(action: &Action) -> Self {
        match action {
            Action::Move { .. } => ActionType::Move,
            Action::Copy { .. } => ActionType::Copy,
            Action::Rename { .. } => ActionType::Rename,
            Action::Trash => ActionType::Trash,
            Action::Unzip { .. } => ActionType::Unzip,
            Action::RunCommand { .. } => ActionType::RunCommand,
        }
    }
}
