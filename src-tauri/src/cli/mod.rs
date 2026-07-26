// Placeholder for a command-line interface.
//
// Nothing calls this yet — `main.rs` goes straight to the Tauri app — and the
// README says as much. It is kept so the module path exists for whenever the CLI
// is actually written.

/// Entry point for command-line invocation, once there is one.
#[derive(Debug, Default, Clone, Copy)]
pub struct Cli;

impl Cli {
    pub fn new() -> Self {
        Self
    }
}
