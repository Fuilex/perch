// Core business logic modules.

pub mod config;
pub mod executor;
pub mod journal;
pub mod matcher;
pub mod planner;
pub mod rule;
pub mod scanner;
pub mod template;
pub mod watcher;

pub use config::AppConfig;
pub use rule::{Action, Condition, Rule};
