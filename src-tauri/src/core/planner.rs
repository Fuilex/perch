// Dry-run planner.

use std::path::{Path, PathBuf};
use uuid::Uuid;

use super::matcher;
use super::rule::{Action, ActionType, PlannedOperation, Rule};
use super::template;

pub fn plan(files: &[PathBuf], rules: &[Rule]) -> Vec<PlannedOperation> {
    let mut operations = Vec::new();
    let active_rules: Vec<&Rule> = rules.iter().filter(|r| r.enabled).collect();

    for file in files {
        for rule in &active_rules {
            if matcher::matches_all(file, &rule.conditions) {
                if let Some(op) = plan_single(file, rule) {
                    operations.push(op);
                }
                if rule.stop_on_match {
                    break;
                }
            }
        }
    }
    operations
}

fn plan_single(file: &Path, rule: &Rule) -> Option<PlannedOperation> {
    let destination = match &rule.action {
        Action::Move { dest_template }
        | Action::Copy { dest_template }
        | Action::Unzip { dest_template } => template::resolve_destination(dest_template, file)?,
        Action::Rename { template: tmpl } => {
            let rendered = template::render_template(tmpl, file, 0, None);
            if rendered.trim().is_empty() {
                return None;
            }
            file.parent()?.join(rendered.trim())
        }
        Action::Trash | Action::RunCommand { .. } => {
            return Some(PlannedOperation {
                id: Uuid::new_v4(),
                source: file.to_path_buf(),
                destination: None,
                action_type: ActionType::from(&rule.action),
                rule_id: rule.id,
                rule_name: rule.name.clone(),
                selected: true,
            })
        }
    };

    // A no-op move (already in the right place) isn't worth showing.
    if destination == file {
        return None;
    }
    let destination = Some(destination);

    Some(PlannedOperation {
        id: Uuid::new_v4(),
        source: file.to_path_buf(),
        destination,
        action_type: ActionType::from(&rule.action),
        rule_id: rule.id,
        rule_name: rule.name.clone(),
        selected: true,
    })
}
