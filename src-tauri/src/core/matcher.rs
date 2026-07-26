// Condition matching engine.

use super::rule::Condition;
use std::path::Path;

pub fn matches_all(path: &Path, conditions: &[Condition]) -> bool {
    conditions.iter().all(|c| matches_condition(path, c))
}

pub fn matches_condition(path: &Path, condition: &Condition) -> bool {
    match condition {
        Condition::Extension(ext) => path
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| e.eq_ignore_ascii_case(ext))
            .unwrap_or(false),
        Condition::Glob(pattern) => {
            let filename = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
            glob::Pattern::new(pattern)
                .map(|p| p.matches(filename))
                .unwrap_or(false)
        }
        Condition::Regex(pattern) => {
            let filename = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
            regex::Regex::new(pattern)
                .map(|r| r.is_match(filename))
                .unwrap_or(false)
        }
        Condition::SizeGreater(size) => std::fs::metadata(path)
            .map(|m| m.len() > *size)
            .unwrap_or(false),
        Condition::SizeSmaller(size) => std::fs::metadata(path)
            .map(|m| m.len() < *size)
            .unwrap_or(false),
        Condition::OlderThan(seconds) => file_age_seconds(path)
            .map(|age| age > *seconds)
            .unwrap_or(false),
        Condition::NewerThan(seconds) => file_age_seconds(path)
            .map(|age| age < *seconds)
            .unwrap_or(false),
        Condition::MimeType(_) | Condition::Duplicate | Condition::MaxDepth(_) => true,
    }
}

fn file_age_seconds(path: &Path) -> Option<i64> {
    let metadata = std::fs::metadata(path).ok()?;
    let modified = metadata.modified().ok()?;
    let elapsed = modified.elapsed().ok()?;
    Some(elapsed.as_secs() as i64)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn test_extension_match() {
        let dir = tempfile::tempdir().unwrap();
        let file = dir.path().join("test.pdf");
        std::fs::File::create(&file).unwrap();
        assert!(matches_condition(
            &file,
            &Condition::Extension("pdf".into())
        ));
        assert!(!matches_condition(
            &file,
            &Condition::Extension("txt".into())
        ));
    }

    #[test]
    fn test_glob_match() {
        let dir = tempfile::tempdir().unwrap();
        let file = dir.path().join("report_2024.pdf");
        std::fs::File::create(&file).unwrap();
        assert!(matches_condition(
            &file,
            &Condition::Glob("report_*.pdf".into())
        ));
        assert!(!matches_condition(
            &file,
            &Condition::Glob("invoice_*.pdf".into())
        ));
    }

    #[test]
    fn test_size_conditions() {
        let dir = tempfile::tempdir().unwrap();
        let file = dir.path().join("test.bin");
        let mut f = std::fs::File::create(&file).unwrap();
        f.write_all(&[0u8; 1024]).unwrap();
        drop(f);
        assert!(matches_condition(&file, &Condition::SizeGreater(512)));
        assert!(matches_condition(&file, &Condition::SizeSmaller(2048)));
    }
}
