// Perch — main entry point
// Handles both GUI (Tauri) and CLI modes.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    perch_lib::run();
}
