// Filesystem watcher.
//
// Watches the folders the user picked and reports batches of touched files
// after a quiet period, so a burst of downloads is handled once rather than
// once per chunk written.

use std::collections::HashSet;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::mpsc::{channel, Receiver, Sender};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use notify::event::{CreateKind, ModifyKind, RenameMode};
use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};

use super::config::WatchedFolder;

/// Callback invoked with a de-duplicated batch of file paths.
pub type OnBatch = Arc<dyn Fn(Vec<PathBuf>) + Send + Sync + 'static>;

pub struct FolderWatcher {
    watcher: Mutex<Option<RecommendedWatcher>>,
    tx: Sender<PathBuf>,
    debounce_ms: Arc<AtomicU64>,
}

impl FolderWatcher {
    /// Start the debounce thread. `on_batch` runs on that thread, never on the
    /// notify callback thread.
    pub fn start(debounce: Duration, on_batch: OnBatch) -> Arc<Self> {
        let (tx, rx) = channel::<PathBuf>();
        let debounce_ms = Arc::new(AtomicU64::new(debounce.as_millis().max(200) as u64));

        {
            let debounce_ms = Arc::clone(&debounce_ms);
            std::thread::Builder::new()
                .name("perch-watcher".into())
                .spawn(move || debounce_loop(rx, debounce_ms, on_batch))
                .expect("could not spawn watcher thread");
        }

        Arc::new(Self {
            watcher: Mutex::new(None),
            tx,
            debounce_ms,
        })
    }

    pub fn set_debounce(&self, debounce: Duration) {
        self.debounce_ms
            .store(debounce.as_millis().max(200) as u64, Ordering::Relaxed);
    }

    /// Replace the watch list. Folders that are disabled or missing are skipped.
    pub fn watch(&self, folders: &[WatchedFolder]) -> Result<(), String> {
        let tx = self.tx.clone();
        let mut watcher = notify::recommended_watcher(move |res: notify::Result<Event>| {
            let Ok(event) = res else { return };
            if !is_interesting(&event.kind) {
                return;
            }
            for path in event.paths {
                if path.is_file() {
                    let _ = tx.send(path);
                }
            }
        })
        .map_err(|e| format!("could not create watcher: {e}"))?;

        let mut watched = 0usize;
        for folder in folders.iter().filter(|f| f.enabled) {
            if !folder.path.exists() {
                log::warn!("skipping missing folder {}", folder.path.display());
                continue;
            }
            let mode = if folder.recursive {
                RecursiveMode::Recursive
            } else {
                RecursiveMode::NonRecursive
            };
            match watcher.watch(&folder.path, mode) {
                Ok(()) => watched += 1,
                Err(e) => log::warn!("could not watch {}: {e}", folder.path.display()),
            }
        }

        // Dropping the previous watcher unregisters its handles.
        *self.watcher.lock().unwrap() = if watched > 0 { Some(watcher) } else { None };
        Ok(())
    }

    pub fn stop(&self) {
        *self.watcher.lock().unwrap() = None;
    }
}

fn is_interesting(kind: &EventKind) -> bool {
    matches!(
        kind,
        EventKind::Create(CreateKind::File | CreateKind::Any)
            | EventKind::Modify(ModifyKind::Name(RenameMode::To | RenameMode::Both))
    )
}

fn debounce_loop(rx: Receiver<PathBuf>, debounce_ms: Arc<AtomicU64>, on_batch: OnBatch) {
    while let Ok(first) = rx.recv() {
        let mut batch: HashSet<PathBuf> = HashSet::new();
        batch.insert(first);

        // Keep collecting until the folder goes quiet.
        loop {
            let wait = Duration::from_millis(debounce_ms.load(Ordering::Relaxed));
            match rx.recv_timeout(wait) {
                Ok(path) => {
                    batch.insert(path);
                }
                Err(_) => break,
            }
        }

        let files: Vec<PathBuf> = batch.into_iter().filter(|p| p.is_file()).collect();
        if !files.is_empty() {
            on_batch(files);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn create_and_rename_are_interesting() {
        assert!(is_interesting(&EventKind::Create(CreateKind::File)));
        assert!(is_interesting(&EventKind::Modify(ModifyKind::Name(
            RenameMode::To
        ))));
        assert!(!is_interesting(&EventKind::Access(
            notify::event::AccessKind::Read
        )));
    }

    #[test]
    fn batches_are_debounced_together() {
        let seen = Arc::new(Mutex::new(Vec::<Vec<PathBuf>>::new()));
        let sink = Arc::clone(&seen);
        let watcher = FolderWatcher::start(
            Duration::from_millis(200),
            Arc::new(move |files| sink.lock().unwrap().push(files)),
        );

        let dir = tempfile::tempdir().unwrap();
        let a = dir.path().join("a.txt");
        let b = dir.path().join("b.txt");
        std::fs::write(&a, "a").unwrap();
        std::fs::write(&b, "b").unwrap();

        watcher.tx.send(a).unwrap();
        watcher.tx.send(b).unwrap();
        std::thread::sleep(Duration::from_millis(700));

        let seen = seen.lock().unwrap();
        assert_eq!(seen.len(), 1, "both files should arrive in one batch");
        assert_eq!(seen[0].len(), 2);
    }
}
