// Path template engine.
// Resolves templates like {name}, {ext}, {year}, {month}, etc.

use chrono::Local;
use std::path::Path;

/// Available template variables:
/// {name}          - filename without extension
/// {ext}           - file extension (without dot)
/// {year}          - 4-digit year
/// {month}         - 2-digit month
/// {day}           - 2-digit day
/// {hour}          - 2-digit hour
/// {minute}        - 2-digit minute
/// {counter}       - auto-incrementing counter (handled by executor)
/// {hash8}         - first 8 chars of SHA-256 hash
/// {source_folder} - name of the source folder

/// Render a path template with file context.
pub fn render_template(
    template: &str,
    source: &Path,
    counter: u32,
    hash: Option<&str>,
) -> String {
    let now = Local::now();

    let name = source
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("unnamed");

    let ext = source
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("");

    let source_folder = source
        .parent()
        .and_then(|p| p.file_name())
        .and_then(|s| s.to_str())
        .unwrap_or("");

    let hash8 = hash
        .map(|h| &h[..8.min(h.len())])
        .unwrap_or("00000000");

    template
        .replace("{name}", name)
        .replace("{ext}", ext)
        .replace("{year}", &now.format("%Y").to_string())
        .replace("{month}", &now.format("%m").to_string())
        .replace("{day}", &now.format("%d").to_string())
        .replace("{hour}", &now.format("%H").to_string())
        .replace("{minute}", &now.format("%M").to_string())
        .replace("{counter}", &format!("{:03}", counter))
        .replace("{hash8}", hash8)
        .replace("{source_folder}", source_folder)
}

/// Validate that a template string contains only known variables.
pub fn validate_template(template: &str) -> Result<(), Vec<String>> {
    let known = [
        "{name}", "{ext}", "{year}", "{month}", "{day}", "{hour}",
        "{minute}", "{counter}", "{hash8}", "{source_folder}",
    ];

    let mut unknown = Vec::new();
    let mut start = 0;

    while let Some(open) = template[start..].find('{') {
        let abs_open = start + open;
        if let Some(close) = template[abs_open..].find('}') {
            let var = &template[abs_open..=abs_open + close];
            if !known.contains(&var) {
                unknown.push(var.to_string());
            }
            start = abs_open + close + 1;
        } else {
            break;
        }
    }

    if unknown.is_empty() {
        Ok(())
    } else {
        Err(unknown)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_basic_template() {
        let source = PathBuf::from("/Users/test/Downloads/report.pdf");
        let result = render_template("{name}.{ext}", &source, 0, None);
        assert_eq!(result, "report.pdf");
    }

    #[test]
    fn test_year_template() {
        let source = PathBuf::from("/Users/test/Downloads/photo.jpg");
        let result = render_template("Photos/{year}/{name}.{ext}", &source, 0, None);
        let year = Local::now().format("%Y").to_string();
        assert_eq!(result, format!("Photos/{}/photo.jpg", year));
    }

    #[test]
    fn test_counter_template() {
        let source = PathBuf::from("/home/user/file.txt");
        let result = render_template("{name}_{counter}.{ext}", &source, 5, None);
        assert_eq!(result, "file_005.txt");
    }

    #[test]
    fn test_hash_template() {
        let source = PathBuf::from("/home/user/image.png");
        let result = render_template(
            "{name}_{hash8}.{ext}",
            &source,
            0,
            Some("abcdef0123456789"),
        );
        assert_eq!(result, "image_abcdef01.png");
    }

    #[test]
    fn test_source_folder() {
        let source = PathBuf::from("/Users/me/Downloads/notes.md");
        let result = render_template("Archive/{source_folder}/{name}.{ext}", &source, 0, None);
        assert_eq!(result, "Archive/Downloads/notes.md");
    }

    #[test]
    fn test_validate_template_valid() {
        assert!(validate_template("docs/{year}/{name}.{ext}").is_ok());
    }

    #[test]
    fn test_validate_template_invalid() {
        let result = validate_template("{unknown}/{name}.{ext}");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains(&"{unknown}".to_string()));
    }
}
