// Full folder scanner.

use std::path::{Path, PathBuf};

/// Scan a directory recursively, returning all file paths.
pub fn scan_folder(root: &Path, max_depth: Option<u32>, skip_hidden: bool) -> Vec<PathBuf> {
    let mut files = Vec::new();
    scan_recursive(root, root, 0, max_depth, skip_hidden, &mut files);
    files
}

fn scan_recursive(
    root: &Path,
    current: &Path,
    depth: u32,
    max_depth: Option<u32>,
    skip_hidden: bool,
    files: &mut Vec<PathBuf>,
) {
    if let Some(max) = max_depth {
        if depth > max {
            return;
        }
    }

    let entries = match std::fs::read_dir(current) {
        Ok(e) => e,
        Err(_) => return,
    };

    for entry in entries.flatten() {
        let path = entry.path();

        if skip_hidden {
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                if name.starts_with('.') {
                    continue;
                }
            }
        }

        if path.is_symlink() {
            if let Ok(target) = std::fs::read_link(&path) {
                let absolute_target = if target.is_relative() {
                    current.join(&target)
                } else {
                    target
                };
                if !absolute_target.starts_with(root) {
                    continue;
                }
            }
        }

        if path.is_dir() {
            scan_recursive(root, &path, depth + 1, max_depth, skip_hidden, files);
        } else if path.is_file() {
            files.push(path);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_scan_folder_basic() {
        let dir = tempfile::tempdir().unwrap();
        fs::File::create(dir.path().join("a.txt")).unwrap();
        fs::File::create(dir.path().join("b.pdf")).unwrap();
        fs::create_dir(dir.path().join("sub")).unwrap();
        fs::File::create(dir.path().join("sub/c.md")).unwrap();
        let files = scan_folder(dir.path(), None, false);
        assert_eq!(files.len(), 3);
    }

    #[test]
    fn test_scan_folder_skip_hidden() {
        let dir = tempfile::tempdir().unwrap();
        fs::File::create(dir.path().join("visible.txt")).unwrap();
        fs::File::create(dir.path().join(".hidden")).unwrap();
        let files = scan_folder(dir.path(), None, true);
        assert_eq!(files.len(), 1);
    }
}
