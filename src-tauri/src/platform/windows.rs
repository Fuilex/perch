// Windows-specific platform code.

/// Get the app data directory on Windows.
pub fn app_data_dir() -> Option<std::path::PathBuf> {
    dirs::data_local_dir().map(|d| d.join("Perch"))
}
