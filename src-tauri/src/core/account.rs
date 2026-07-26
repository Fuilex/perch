// Local account: one profile, one password, kept on this machine.
//
// There is no server behind this and there is no sync — Perch is local-first, so
// "signing in" means unlocking the app on this computer. What that buys is a
// gate in front of the rules and the history, which matters on a shared login.
//
// What it deliberately is NOT: encryption at rest. The rules and journal files
// stay readable to anyone who can read the directory, and the UI says so. Making
// them secret would mean encrypting the data with a key derived from the
// password, which is a much larger change than a lock screen.

use std::path::Path;

use argon2::password_hash::{
    rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString,
};
use argon2::Argon2;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Shortest password accepted. Kept modest on purpose: this guards a desktop
/// app against a housemate, not a password database against an attacker.
pub const MIN_PASSWORD_LEN: usize = 8;
pub const MAX_USERNAME_LEN: usize = 48;

/// The stored profile. `password_hash` is a PHC string, which carries the salt
/// and the Argon2 parameters with it, so nothing else needs to be recorded.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Account {
    pub username: String,
    pub created_at: DateTime<Utc>,
    pub password_hash: String,
}

/// What the UI is allowed to know without being signed in.
#[derive(Debug, Clone, Serialize)]
pub struct AccountState {
    /// An account has been created, so the app starts locked.
    pub exists: bool,
    /// Present once an account exists; there is nothing secret about the name.
    pub username: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    /// False while the app is locked.
    pub unlocked: bool,
}

impl Account {
    /// Hashes `password` with Argon2id and default parameters.
    pub fn create(username: &str, password: &str) -> Result<Self, String> {
        let username = username.trim();
        validate_username(username)?;
        validate_password(password)?;

        Ok(Self {
            username: username.to_string(),
            created_at: Utc::now(),
            password_hash: hash_password(password)?,
        })
    }

    /// Constant-time-ish comparison courtesy of Argon2; a wrong password and a
    /// malformed hash are reported the same way so nothing is leaked.
    pub fn verify(&self, password: &str) -> bool {
        let Ok(parsed) = PasswordHash::new(&self.password_hash) else {
            log::error!("stored password hash is not readable");
            return false;
        };
        Argon2::default()
            .verify_password(password.as_bytes(), &parsed)
            .is_ok()
    }

    pub fn set_password(&mut self, password: &str) -> Result<(), String> {
        validate_password(password)?;
        self.password_hash = hash_password(password)?;
        Ok(())
    }

    pub fn state(&self, unlocked: bool) -> AccountState {
        AccountState {
            exists: true,
            username: Some(self.username.clone()),
            created_at: Some(self.created_at),
            unlocked,
        }
    }
}

impl AccountState {
    /// No account yet — the app is open and offers to create one.
    pub fn none() -> Self {
        Self {
            exists: false,
            username: None,
            created_at: None,
            unlocked: true,
        }
    }
}

fn hash_password(password: &str) -> Result<String, String> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(|e| format!("could not hash the password: {e}"))
}

pub fn validate_username(username: &str) -> Result<(), String> {
    let username = username.trim();
    if username.is_empty() {
        return Err("Pick a name for the account".to_string());
    }
    if username.chars().count() > MAX_USERNAME_LEN {
        return Err(format!(
            "That name is longer than {MAX_USERNAME_LEN} characters"
        ));
    }
    if username.chars().any(|c| c.is_control()) {
        return Err("That name contains characters that aren't allowed".to_string());
    }
    Ok(())
}

pub fn validate_password(password: &str) -> Result<(), String> {
    if password.chars().count() < MIN_PASSWORD_LEN {
        return Err(format!("Use at least {MIN_PASSWORD_LEN} characters"));
    }
    if password.trim().is_empty() {
        return Err("A password of only spaces won't do".to_string());
    }
    Ok(())
}

/// Reads the profile, or `None` when there isn't one. A file that exists but
/// can't be parsed is an error rather than "no account": treating a damaged
/// profile as absent would drop the lock and let anyone straight in.
pub fn load(path: &Path) -> Result<Option<Account>, String> {
    if !path.exists() {
        return Ok(None);
    }
    let text = std::fs::read_to_string(path)
        .map_err(|e| format!("could not read {}: {e}", path.display()))?;
    serde_json::from_str(&text)
        .map(Some)
        .map_err(|e| format!("{} is damaged: {e}", path.display()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn verifies_the_right_password_and_rejects_others() {
        let account = Account::create("serge", "correct horse").unwrap();
        assert!(account.verify("correct horse"));
        assert!(!account.verify("Correct horse"));
        assert!(!account.verify(""));
    }

    #[test]
    fn stores_a_hash_and_not_the_password() {
        let account = Account::create("serge", "hunter2hunter2").unwrap();
        assert!(!account.password_hash.contains("hunter2"));
        assert!(account.password_hash.starts_with("$argon2"));
    }

    #[test]
    fn the_same_password_hashes_differently_each_time() {
        let a = Account::create("a", "same password").unwrap();
        let b = Account::create("b", "same password").unwrap();
        assert_ne!(a.password_hash, b.password_hash, "salt should differ");
    }

    #[test]
    fn changing_the_password_invalidates_the_old_one() {
        let mut account = Account::create("serge", "first password").unwrap();
        account.set_password("second password").unwrap();
        assert!(account.verify("second password"));
        assert!(!account.verify("first password"));
    }

    #[test]
    fn rejects_short_passwords_and_empty_names() {
        assert!(Account::create("serge", "short").is_err());
        assert!(Account::create("   ", "long enough password").is_err());
    }

    #[test]
    fn a_damaged_profile_is_an_error_not_an_open_door() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("account.json");
        std::fs::write(&path, "{ not json").unwrap();
        assert!(load(&path).is_err());
    }

    #[test]
    fn a_missing_profile_means_no_account() {
        let dir = tempfile::tempdir().unwrap();
        assert!(load(&dir.path().join("nothing.json")).unwrap().is_none());
    }
}
