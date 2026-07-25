// Platform-specific code.

#[cfg(target_os = "macos")]
pub mod macos;
#[cfg(target_os = "windows")]
pub mod windows;
#[cfg(target_os = "linux")]
pub mod linux;

/// Get the platform name.
pub fn platform_name() -> &'static str {
    #[cfg(target_os = "macos")]
    { "macOS" }
    #[cfg(target_os = "windows")]
    { "Windows" }
    #[cfg(target_os = "linux")]
    { "Linux" }
    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    { "Unknown" }
}
