// Persistent application state: config + rules on disk, journal in SQLite.
//
// Everything the UI can change lives here, so the app never needs the user to
// hand-edit a config file.

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;

use super::account::{self, Account, AccountState};
use super::config::AppConfig;
use super::journal::Journal;
use super::rule::Rule;

/// Resolved on-disk locations for Perch's data.
#[derive(Debug, Clone)]
pub struct Paths {
    pub root: PathBuf,
    pub config: PathBuf,
    pub rules: PathBuf,
    pub journal: PathBuf,
    pub account: PathBuf,
}

impl Paths {
    pub fn resolve() -> Self {
        let root = dirs::data_local_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("Perch");
        Self {
            config: root.join("config.json"),
            rules: root.join("rules.json"),
            journal: root.join("journal.db"),
            account: root.join("account.json"),
            root,
        }
    }

    fn ensure_root(&self) {
        if !self.root.exists() {
            let _ = fs::create_dir_all(&self.root);
        }
    }
}

/// Shared, mutable application state. Guarded by a mutex; every mutation is
/// written straight back to disk so a crash never loses a rule.
pub struct AppState {
    paths: Paths,
    config: Mutex<AppConfig>,
    rules: Mutex<Vec<Rule>>,
    account: Mutex<Option<Account>>,
    /// Session-only. Starts false when a profile exists, so the app comes up
    /// locked; never written to disk, so quitting always re-locks.
    unlocked: AtomicBool,
    pub journal: Journal,
}

impl AppState {
    pub fn load() -> Result<Self, String> {
        let paths = Paths::resolve();
        paths.ensure_root();

        let config = read_json(&paths.config).unwrap_or_default();
        let rules: Vec<Rule> = read_json(&paths.rules).unwrap_or_default();

        // A damaged profile is fatal rather than ignored — see account::load.
        let account = account::load(&paths.account)?;

        let journal = Journal::open(&paths.journal.to_string_lossy())
            .map_err(|e| format!("could not open journal: {e}"))?;

        Ok(Self {
            paths,
            config: Mutex::new(config),
            rules: Mutex::new(rules),
            unlocked: AtomicBool::new(account.is_none()),
            account: Mutex::new(account),
            journal,
        })
    }

    pub fn paths(&self) -> &Paths {
        &self.paths
    }

    // -- account -----------------------------------------------------------

    pub fn account_state(&self) -> AccountState {
        match self.account.lock().unwrap().as_ref() {
            Some(account) => account.state(self.is_unlocked()),
            None => AccountState::none(),
        }
    }

    pub fn is_unlocked(&self) -> bool {
        self.unlocked.load(Ordering::SeqCst)
    }

    /// Fails when an account exists and nobody has signed in yet. Commands that
    /// read or change the user's data call this first.
    pub fn require_unlocked(&self) -> Result<(), String> {
        if self.is_unlocked() {
            Ok(())
        } else {
            Err("Perch is locked — sign in first".to_string())
        }
    }

    pub fn create_account(&self, username: &str, password: &str) -> Result<AccountState, String> {
        let mut guard = self.account.lock().unwrap();
        if guard.is_some() {
            return Err("An account already exists on this machine".to_string());
        }

        let account = Account::create(username, password)?;
        self.persist_account(Some(&account))?;
        let state = account.state(true);
        *guard = Some(account);
        self.unlocked.store(true, Ordering::SeqCst);
        Ok(state)
    }

    /// Unlocks on a correct password. The caller is responsible for not making
    /// this cheap to hammer; see `commands::sign_in`.
    pub fn sign_in(&self, password: &str) -> Result<AccountState, String> {
        let guard = self.account.lock().unwrap();
        let Some(account) = guard.as_ref() else {
            return Err("There is no account to sign in to".to_string());
        };

        if !account.verify(password) {
            return Err("That password doesn't match".to_string());
        }

        self.unlocked.store(true, Ordering::SeqCst);
        Ok(account.state(true))
    }

    pub fn sign_out(&self) -> AccountState {
        let guard = self.account.lock().unwrap();
        match guard.as_ref() {
            Some(account) => {
                self.unlocked.store(false, Ordering::SeqCst);
                account.state(false)
            }
            // Nothing to sign out of; leave the app open.
            None => AccountState::none(),
        }
    }

    pub fn change_password(&self, current: &str, next: &str) -> Result<(), String> {
        let mut guard = self.account.lock().unwrap();
        let Some(account) = guard.as_mut() else {
            return Err("There is no account on this machine".to_string());
        };

        if !account.verify(current) {
            return Err("The current password doesn't match".to_string());
        }

        account.set_password(next)?;
        let snapshot = account.clone();
        drop(guard);
        self.persist_account(Some(&snapshot))
    }

    /// Removes the profile. Rules, folders and history are untouched — this
    /// drops the lock, it doesn't wipe the user's data.
    pub fn delete_account(&self, password: &str) -> Result<AccountState, String> {
        let mut guard = self.account.lock().unwrap();
        let Some(account) = guard.as_ref() else {
            return Err("There is no account on this machine".to_string());
        };

        if !account.verify(password) {
            return Err("That password doesn't match".to_string());
        }

        self.persist_account(None)?;
        *guard = None;
        self.unlocked.store(true, Ordering::SeqCst);
        Ok(AccountState::none())
    }

    fn persist_account(&self, account: Option<&Account>) -> Result<(), String> {
        self.paths.ensure_root();
        match account {
            Some(account) => write_json(&self.paths.account, account),
            None => match fs::remove_file(&self.paths.account) {
                Ok(()) => Ok(()),
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
                Err(e) => Err(format!(
                    "could not remove {}: {e}",
                    self.paths.account.display()
                )),
            },
        }
    }

    // -- config ------------------------------------------------------------

    pub fn config(&self) -> AppConfig {
        self.config.lock().unwrap().clone()
    }

    pub fn set_config(&self, next: AppConfig) -> Result<AppConfig, String> {
        let mut guard = self.config.lock().unwrap();
        *guard = next;
        let snapshot = guard.clone();
        drop(guard);
        self.persist_config(&snapshot)?;
        Ok(snapshot)
    }

    /// Mutate the config in place and persist the result.
    pub fn update_config<F>(&self, f: F) -> Result<AppConfig, String>
    where
        F: FnOnce(&mut AppConfig),
    {
        let mut guard = self.config.lock().unwrap();
        f(&mut guard);
        let snapshot = guard.clone();
        drop(guard);
        self.persist_config(&snapshot)?;
        Ok(snapshot)
    }

    fn persist_config(&self, config: &AppConfig) -> Result<(), String> {
        self.paths.ensure_root();
        write_json(&self.paths.config, config)
    }

    // -- rules -------------------------------------------------------------

    pub fn rules(&self) -> Vec<Rule> {
        let mut rules = self.rules.lock().unwrap().clone();
        rules.sort_by_key(|r| r.order);
        rules
    }

    /// Mutate the rule list in place and persist the result.
    pub fn update_rules<F, T>(&self, f: F) -> Result<T, String>
    where
        F: FnOnce(&mut Vec<Rule>) -> T,
    {
        let mut guard = self.rules.lock().unwrap();
        let out = f(&mut guard);
        let snapshot = guard.clone();
        drop(guard);
        self.persist_rules(&snapshot)?;
        Ok(out)
    }

    pub fn set_rules(&self, next: Vec<Rule>) -> Result<Vec<Rule>, String> {
        self.update_rules(|rules| {
            *rules = next;
            rules.clone()
        })
    }

    fn persist_rules(&self, rules: &[Rule]) -> Result<(), String> {
        self.paths.ensure_root();
        write_json(&self.paths.rules, rules)
    }

    /// Look up a rule name for display (activity feed, notifications).
    pub fn rule_name(&self, id: &uuid::Uuid) -> String {
        self.rules
            .lock()
            .unwrap()
            .iter()
            .find(|r| &r.id == id)
            .map(|r| r.name.clone())
            .unwrap_or_else(|| "Deleted rule".to_string())
    }
}

// ---------------------------------------------------------------------------
// JSON helpers
// ---------------------------------------------------------------------------

fn read_json<T: serde::de::DeserializeOwned>(path: &Path) -> Option<T> {
    let text = fs::read_to_string(path).ok()?;
    match serde_json::from_str(&text) {
        Ok(value) => Some(value),
        Err(e) => {
            log::warn!("could not parse {}: {e}", path.display());
            // Keep the unreadable file around instead of silently overwriting it.
            let backup = path.with_extension("corrupt.json");
            let _ = fs::rename(path, backup);
            None
        }
    }
}

/// `?Sized` so a slice can be passed straight in — `persist_rules` holds a
/// `&[Rule]`, and taking it by value would mean cloning the whole list.
fn write_json<T: serde::Serialize + ?Sized>(path: &Path, value: &T) -> Result<(), String> {
    let text = serde_json::to_string_pretty(value).map_err(|e| e.to_string())?;
    // Write to a temp file first so an interrupted write can't truncate the
    // real one.
    let tmp = path.with_extension("tmp");
    fs::write(&tmp, text).map_err(|e| format!("write {}: {e}", tmp.display()))?;
    fs::rename(&tmp, path).map_err(|e| format!("replace {}: {e}", path.display()))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::config::Theme;

    #[test]
    fn json_roundtrip() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("config.json");
        let mut cfg = AppConfig::default();
        cfg.theme = Theme::Light;
        write_json(&path, &cfg).unwrap();
        let back: AppConfig = read_json(&path).unwrap();
        assert_eq!(back.theme, Theme::Light);
    }

    #[test]
    fn corrupt_file_is_moved_aside() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("rules.json");
        fs::write(&path, "{ not json").unwrap();
        let value: Option<Vec<Rule>> = read_json(&path);
        assert!(value.is_none());
        assert!(!path.exists());
        assert!(path.with_extension("corrupt.json").exists());
    }
}
