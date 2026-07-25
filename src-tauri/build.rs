fn main() {
    // Use ASCII junction path C:\perch-icons for windres compatibility.
    // MinGW's windres cannot handle non-ASCII paths (Cyrillic desktop).
    let icon = r"C:\perch-icons\icon.ico";
    if std::path::Path::new(icon).exists() {
        // Tell tauri-winres about our icon via environment
        std::env::set_var("TAURI_WINRES_SKIP", "1");
    }
    tauri_build::build();
}
