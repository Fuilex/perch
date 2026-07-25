// File operation executor.

use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;

use super::journal::{Journal, JournalEntry};
use super::rule::{ActionType, PlannedOperation};

pub fn execute(operations: &[PlannedOperation], journal: &Journal) -> Result<Vec<JournalEntry>, String> {
    let mut entries = Vec::new();
    let batch_id = Uuid::new_v4();

    for op in operations.iter().filter(|o| o.selected) {
        let entry = execute_single(op, batch_id)?;
        journal.record(&entry).map_err(|e| e.to_string())?;
        entries.push(entry);
    }
    Ok(entries)
}

fn execute_single(op: &PlannedOperation, batch_id: Uuid) -> Result<JournalEntry, String> {
    if !op.source.exists() {
        return Err(format!("Source not found: {:?}", op.source));
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
            Ok(JournalEntry::new(op.id, batch_id, op.rule_id, op.source.clone(), Some(final_dest), ActionType::Move))
        }
        ActionType::Copy => {
            let dest = op.destination.as_ref().ok_or("Copy requires destination")?;
            let final_dest = resolve_collision(dest)?;
            ensure_parent_dir(&final_dest)?;
            fs::copy(&op.source, &final_dest).map_err(|e| e.to_string())?;
            Ok(JournalEntry::new(op.id, batch_id, op.rule_id, op.source.clone(), Some(final_dest), ActionType::Copy))
        }
        ActionType::Rename => {
            let dest = op.destination.as_ref().ok_or("Rename requires destination")?;
            let final_dest = resolve_collision(dest)?;
            fs::rename(&op.source, &final_dest).map_err(|e| e.to_string())?;
            Ok(JournalEntry::new(op.id, batch_id, op.rule_id, op.source.clone(), Some(final_dest), ActionType::Rename))
        }
        ActionType::Trash => {
            trash::delete(&op.source).map_err(|e| e.to_string())?;
            Ok(JournalEntry::new(op.id, batch_id, op.rule_id, op.source.clone(), None, ActionType::Trash))
        }
        _ => Ok(JournalEntry::new(op.id, batch_id, op.rule_id, op.source.clone(), op.destination.clone(), op.action_type.clone())),
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
