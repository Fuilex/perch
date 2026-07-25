# Architecture

## System Overview

```mermaid
graph TB
    subgraph Frontend["Frontend (React + TypeScript)"]
        UI[UI Components]
        Screens[Screens]
        Store[Zustand Stores]
        Animations[Framer Motion]
    end

    subgraph Bridge["Tauri Bridge"]
        Commands[Typed Commands]
        Events[FS Events]
    end

    subgraph Backend["Backend (Rust)"]
        Core[Core Engine]
        Watcher[FS Watcher]
        Scanner[Scanner]
        Matcher[Matcher]
        Planner[Planner]
        Executor[Executor]
        Journal[SQLite Journal]
        Template[Template Engine]
    end

    subgraph Storage["Storage"]
        YAML[rules.yaml]
        DB[(journal.db)]
        Config[config.yaml]
    end

    UI --> Store
    Store --> Commands
    Commands --> Core
    Watcher --> Events
    Events --> Store
    Core --> Matcher
    Core --> Planner
    Core --> Executor
    Core --> Template
    Executor --> Journal
    Journal --> DB
    Core --> YAML
    Core --> Config
```

## Data Flow

1. **FS Event** → Watcher debounces → Scanner collects files
2. **Matcher** evaluates files against rules (top-to-bottom, stop-on-match)
3. **Planner** generates `PlannedOperation[]` (dry-run)
4. **Executor** performs atomic operations, records each in Journal
5. **Journal** enables full undo (single or batch)

## Key Principles

- All file logic in Rust — zero business logic in TypeScript
- Types generated from Rust via ts-rs — single source of truth
- Atomic operations: copy-then-delete, collision resolution
- Never delete without trash
- All state changes through Zustand stores
