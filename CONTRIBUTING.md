# Contributing to Perch

Thank you for your interest in contributing.

## Development Setup

```bash
git clone https://github.com/fuilex/perch.git
cd perch
npm install
cargo tauri dev
```

## Code Style

- **Rust**: `cargo fmt`, `cargo clippy -- -D warnings`
- **TypeScript**: `npm run lint`, `npm run format`
- All UI text in English, neutral tone, no emoji

## Pull Requests

1. Fork the repo and create a branch from `main`
2. Add tests for new functionality
3. Ensure CI passes: `npm run typecheck && npm run lint && npm run test && cargo test`
4. Write a clear PR description

## Design System

All visual changes must use tokens from `src/design/tokens.ts`. No hardcoded colors, sizes, or shadows in components.

## Commit Messages

Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
