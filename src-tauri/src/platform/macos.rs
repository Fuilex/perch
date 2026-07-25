pub fn app_data_dir() -> Option<std::path::PathBuf> {
    dirs::data_dir().map(|d| d.join("Perch"))
}
