// SQLite undo journal.

use chrono::{DateTime, Utc};
use rusqlite::{params, Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use uuid::Uuid;

use super::rule::ActionType;

/// A recorded operation in the undo journal.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JournalEntry {
    pub id: Uuid,
    pub batch_id: Uuid,
    pub rule_id: Uuid,
    pub source: PathBuf,
    pub destination: Option<PathBuf>,
    pub action_type: ActionType,
    pub timestamp: DateTime<Utc>,
    pub undone: bool,
}

impl JournalEntry {
    pub fn new(
        id: Uuid,
        batch_id: Uuid,
        rule_id: Uuid,
        source: PathBuf,
        destination: Option<PathBuf>,
        action_type: ActionType,
    ) -> Self {
        Self {
            id,
            batch_id,
            rule_id,
            source,
            destination,
            action_type,
            timestamp: Utc::now(),
            undone: false,
        }
    }
}

pub struct Journal {
    conn: Mutex<Connection>,
}

impl Journal {
    pub fn open(path: &str) -> SqlResult<Self> {
        let conn = Connection::open(path)?;
        conn.pragma_update(None, "journal_mode", "WAL")?;
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS journal (
                id TEXT PRIMARY KEY,
                batch_id TEXT NOT NULL,
                rule_id TEXT NOT NULL,
                source TEXT NOT NULL,
                destination TEXT,
                action_type TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                undone INTEGER NOT NULL DEFAULT 0
            );
            CREATE INDEX IF NOT EXISTS idx_batch ON journal(batch_id);
            CREATE INDEX IF NOT EXISTS idx_timestamp ON journal(timestamp DESC);",
        )?;
        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    pub fn open_in_memory() -> SqlResult<Self> {
        Self::open(":memory:")
    }

    pub fn record(&self, entry: &JournalEntry) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO journal (id, batch_id, rule_id, source, destination, action_type, timestamp, undone)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                entry.id.to_string(),
                entry.batch_id.to_string(),
                entry.rule_id.to_string(),
                entry.source.to_string_lossy().to_string(),
                entry.destination.as_ref().map(|d| d.to_string_lossy().to_string()),
                serde_json::to_string(&entry.action_type).unwrap_or_default(),
                entry.timestamp.to_rfc3339(),
                entry.undone as i32,
            ],
        )?;
        Ok(())
    }

    pub fn mark_undone(&self, id: &Uuid) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE journal SET undone = 1 WHERE id = ?1",
            params![id.to_string()],
        )?;
        Ok(())
    }

    pub fn get_all(&self, limit: usize) -> SqlResult<Vec<JournalEntry>> {
        self.query(
            "SELECT id, batch_id, rule_id, source, destination, action_type, timestamp, undone
             FROM journal ORDER BY timestamp DESC LIMIT ?1",
            params![limit as i64],
        )
    }

    /// One entry by id.
    pub fn get(&self, id: &Uuid) -> SqlResult<Option<JournalEntry>> {
        let mut rows = self.query(
            "SELECT id, batch_id, rule_id, source, destination, action_type, timestamp, undone
             FROM journal WHERE id = ?1",
            params![id.to_string()],
        )?;
        Ok(rows.pop())
    }

    /// Every entry in a batch, newest first — the order undo needs.
    pub fn get_batch(&self, batch_id: &Uuid) -> SqlResult<Vec<JournalEntry>> {
        self.query(
            "SELECT id, batch_id, rule_id, source, destination, action_type, timestamp, undone
             FROM journal WHERE batch_id = ?1 ORDER BY timestamp DESC",
            params![batch_id.to_string()],
        )
    }

    /// Drop the whole history (the UI offers this under Settings → Data).
    pub fn clear(&self) -> SqlResult<usize> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM journal", [])
    }

    pub fn count(&self) -> SqlResult<i64> {
        let conn = self.conn.lock().unwrap();
        conn.query_row("SELECT COUNT(*) FROM journal", [], |row| row.get(0))
    }

    fn query<P: rusqlite::Params>(&self, sql: &str, params: P) -> SqlResult<Vec<JournalEntry>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(sql)?;
        let entries = stmt.query_map(params, |row| {
            let id_str: String = row.get(0)?;
            let batch_str: String = row.get(1)?;
            let rule_str: String = row.get(2)?;
            let source_str: String = row.get(3)?;
            let dest_str: Option<String> = row.get(4)?;
            let action_str: String = row.get(5)?;
            let ts_str: String = row.get(6)?;
            let undone: i32 = row.get(7)?;
            Ok(JournalEntry {
                id: Uuid::parse_str(&id_str).unwrap_or_default(),
                batch_id: Uuid::parse_str(&batch_str).unwrap_or_default(),
                rule_id: Uuid::parse_str(&rule_str).unwrap_or_default(),
                source: PathBuf::from(source_str),
                destination: dest_str.map(PathBuf::from),
                action_type: serde_json::from_str(&action_str).unwrap_or(ActionType::Move),
                timestamp: DateTime::parse_from_rfc3339(&ts_str)
                    .map(|dt| dt.with_timezone(&Utc))
                    .unwrap_or_default(),
                undone: undone != 0,
            })
        })?;
        entries.collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_journal_record_and_retrieve() {
        let journal = Journal::open_in_memory().unwrap();
        let entry = JournalEntry::new(
            Uuid::new_v4(),
            Uuid::new_v4(),
            Uuid::new_v4(),
            PathBuf::from("/source/file.txt"),
            Some(PathBuf::from("/dest/file.txt")),
            ActionType::Move,
        );
        journal.record(&entry).unwrap();
        let entries = journal.get_all(100).unwrap();
        assert_eq!(entries.len(), 1);
        assert!(!entries[0].undone);
    }
}
