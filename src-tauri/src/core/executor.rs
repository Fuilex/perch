// File operation executor.

use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;

use super::journal::{Journal, JournalEntry};
use super::rule::{ActionType, PlannedOperation};

/// A single operation that could not be carried out. One bad file shouldn't
/// abort the rest of the batch, so these are collected rather than returned
/// as an error.
#[derive(Debug, Clone, Serialize)]
pub struct OperationFailure {
    pub source: PathBuf,
    pub rule_name: String,
    pub error: String,
}

/// Outcome of applying a batch.
#[derive(Debug, Clone, Serialize)]
pub struct ExecutionReport {
    pub batch_id: Uuid,
    pub entries: Vec<JournalEntry>,
    pub failures: Vec<OperationFailure>,
}

pub fn execute(operations: &[PlannedOperation], journal: &Journal) -> ExecutionReport {
    let batch_id = Uuid::new_v4();
    let mut entries = Vec::new();
    let mut failures = Vec::new();

    for op in operations.iter().filter(|o| o.selected) {
        match execute_single(op, batch_id) {
            Ok(entry) => {
                if let Err(e) = journal.record(&entry) {
                    log::error!("could not journal {}: {e}", entry.source.display());
                }
                entries.push(entry);
            }
            Err(error) => failures.push(OperationFailure {
                source: op.source.clone(),
                rule_name: op.rule_name.clone(),
                error,
            }),
        }
    }

    ExecutionReport {
        batch_id,
        entries,
        failures,
    }
}

fn execute_single(op: &PlannedOperation, batch_id: Uuid) -> Result<JournalEntry, String> {
    if !op.source.exists() {
        return Err(format!("{} no longer exists", op.source.display()));
    }

    match op.action_type {
        ActionType::Move => {
            let dest = op.destination.as_ref().ok_or("Move requires destination")?;
            let final_dest = resolve_collision(dest)?;
            ensure_parent_dir(&final_dest)?;
            if fs::rename(&op.source, &final_dest).is_err() {
                fs::copy(&op.source, &final_dest).map_err(|e| e.to_string())?;
                fs::remove_file(&op.source).map_err(|e| e.to_string())?;
            }
            Ok(JournalEntry::new(
                op.id,
                batch_id,
                op.rule_id,
                op.source.clone(),
                Some(final_dest),
                ActionType::Move,
            ))
        }
        ActionType::Copy => {
            let dest = op.destination.as_ref().ok_or("Copy requires destination")?;
            let final_dest = resolve_collision(dest)?;
            ensure_parent_dir(&final_dest)?;
            fs::copy(&op.source, &final_dest).map_err(|e| e.to_string())?;
            Ok(JournalEntry::new(
                op.id,
                batch_id,
                op.rule_id,
                op.source.clone(),
                Some(final_dest),
                ActionType::Copy,
            ))
        }
        ActionType::Rename => {
            let dest = op
                .destination
                .as_ref()
                .ok_or("Rename requires destination")?;
            let final_dest = resolve_collision(dest)?;
            fs::rename(&op.source, &final_dest).map_err(|e| e.to_string())?;
            Ok(JournalEntry::new(
                op.id,
                batch_id,
                op.rule_id,
                op.source.clone(),
                Some(final_dest),
                ActionType::Rename,
            ))
        }
        ActionType::Trash => {
            trash::delete(&op.source).map_err(|e| e.to_string())?;
            Ok(JournalEntry::new(
                op.id,
                batch_id,
                op.rule_id,
                op.source.clone(),
                None,
                ActionType::Trash,
            ))
        }
        _ => Ok(JournalEntry::new(
            op.id,
            batch_id,
            op.rule_id,
            op.source.clone(),
            op.destination.clone(),
            op.action_type.clone(),
        )),
    }
}

/// Reverse a single journalled operation.
///
/// Moves and renames go back where they came from; a copy is removed. Trashing
/// is deliberately not reversed from here — the file lives in the OS recycle
/// bin and restoring it is the shell's job.
pub fn undo(entry: &JournalEntry) -> Result<(), String> {
    if entry.undone {
        return Err("This operation was already undone".to_string());
    }

    match entry.action_type {
        ActionType::Move | ActionType::Rename => {
            let dest = entry
                .destination
                .as_ref()
                .ok_or("Nothing recorded to move back")?;
            if !dest.exists() {
                return Err(format!(
                    "{} is no longer there — it may have been moved again",
                    dest.display()
                ));
            }
            let restore_to = resolve_collision(&entry.source)?;
            ensure_parent_dir(&restore_to)?;
            if fs::rename(dest, &restore_to).is_err() {
                fs::copy(dest, &restore_to).map_err(|e| e.to_string())?;
                fs::remove_file(dest).map_err(|e| e.to_string())?;
            }
            Ok(())
        }
        ActionType::Copy => {
            let dest = entry
                .destination
                .as_ref()
                .ok_or("Nothing recorded to remove")?;
            if dest.exists() {
                fs::remove_file(dest).map_err(|e| e.to_string())?;
            }
            Ok(())
        }
        ActionType::Trash => Err("Trashed files are restored from the Recycle Bin".to_string()),
        ActionType::Unzip | ActionType::RunCommand => {
            Err("This kind of operation can't be undone automatically".to_string())
        }
    }
}

fn resolve_collision(dest: &Path) -> Result<PathBuf, String> {
    if !dest.exists() {
        return Ok(dest.to_path_buf());
    }
    let stem = dest.file_stem().and_then(|s| s.to_str()).unwrap_or("file");
    let ext = dest.extension().and_then(|s| s.to_str());
    let parent = dest.parent().unwrap_or(Path::new("."));
    for counter in 1..=999 {
        let new_name = match ext {
            Some(e) => format!("{}_{}.{}", stem, counter, e),
            None => format!("{}_{}", stem, counter),
        };
        let candidate = parent.join(new_name);
        if !candidate.exists() {
            return Ok(candidate);
        }
    }
    Err(format!("Could not resolve collision for {:?}", dest))
}

fn ensure_parent_dir(path: &Path) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}
