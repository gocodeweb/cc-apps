---
name: canvas
description: |
  **The primary skill for terminal TUI components.** Covers spawning, controlling, and interacting with terminal canvases.
  Use when displaying calendars, documents, tables, JSON, browser, or flight bookings.
---

# Canvas TUI Toolkit

**Start here when using terminal canvases.** This skill covers the overall workflow, canvas types, and IPC communication.

## Overview

Canvas provides interactive terminal displays (TUIs) that Claude can spawn and control. Each canvas type supports multiple scenarios for different interaction modes.

## Available Canvas Types

| Canvas | Purpose | Scenarios |
|--------|---------|-----------|
| `calendar` | Display calendars, pick meeting times | `display`, `meeting-picker` |
| `document` | View/edit markdown documents | `display`, `edit`, `email-preview` |
| `flight` | Flight comparison and seat selection | `booking` |
| `zmanim` | Display Jewish halachic times | `display` |
| `table` | Display and select from tabular data | `display`, `select`, `multi-select` |
| `json` | JSON/YAML tree explorer | `explore`, `select` |
| `kanban` | Task board with columns | `display`, `select`, `manage` |
| `browser` | Terminal web browser (browsh) | `display` |

## Quick Start

```bash
cd ${CLAUDE_PLUGIN_ROOT}

# Run canvas in current terminal
bun run src/cli.ts show calendar

# Spawn canvas in new tmux split
bun run src/cli.ts spawn calendar --scenario meeting-picker --config '{...}'

# Spawn browser to URL
bun run src/cli.ts browser --url "http://localhost:3000"
```

## Spawning Canvases

**Always use `spawn` for interactive scenarios** - this opens the canvas in a tmux split pane while keeping the conversation terminal available.

```bash
bun run src/cli.ts spawn [kind] --scenario [name] --config '[json]'
```

**Parameters:**
- `kind`: Canvas type (calendar, document, flight, table, json, kanban, browser)
- `--scenario`: Interaction mode (e.g., display, meeting-picker, edit)
- `--config`: JSON configuration for the canvas
- `--id`: Optional canvas instance ID for IPC

**Browser-specific:**
```bash
bun run src/cli.ts browser --url "http://localhost:3000"
bun run src/cli.ts browser --url "http://localhost:3000" --gui  # With Firefox DevTools
```

## IPC Communication

Interactive canvases communicate via Unix domain sockets.

**Canvas → Controller:**
```typescript
{ type: "ready", scenario }        // Canvas is ready
{ type: "selected", data }         // User made a selection
{ type: "cancelled", reason? }     // User cancelled
{ type: "error", message }         // Error occurred
```

**Controller → Canvas:**
```typescript
{ type: "update", config }  // Update canvas configuration
{ type: "close" }           // Request canvas to close
{ type: "ping" }            // Health check
```

## High-Level API

For programmatic use, import the API module:

```typescript
import { pickMeetingTime, editDocument, bookFlight } from "${CLAUDE_PLUGIN_ROOT}/src/api";

// Spawn meeting picker and wait for selection
const result = await pickMeetingTime({
  calendars: [...],
  slotGranularity: 30,
});

if (result.success && result.data) {
  console.log(`Selected: ${result.data.startTime}`);
}
```

## Requirements

- **tmux**: Canvas spawning requires a tmux session
- **Terminal with mouse support**: For click-based interactions
- **Bun**: Runtime for executing canvas commands

## tmux Configuration

Add these settings to `~/.tmux.conf` for the best canvas experience:

```bash
# Enable mouse support (resize panes, scroll, click)
set -g mouse on

# Copy to system clipboard on macOS
bind-key -T copy-mode-vi MouseDragEnd1Pane send-keys -X copy-pipe-and-cancel "pbcopy"
bind-key -T copy-mode MouseDragEnd1Pane send-keys -X copy-pipe-and-cancel "pbcopy"

# True color support (better graphics in browsh)
set -g default-terminal "tmux-256color"
set -ag terminal-overrides ",xterm-256color:RGB"
```

After editing, reload with: `tmux source-file ~/.tmux.conf`

### Resizing Canvas Panes

| Method | How |
|--------|-----|
| **Mouse** | Drag the border between panes |
| **Keys** | `Ctrl+B` then `Ctrl+←` or `Ctrl+→` |
| **Precise** | `Ctrl+B` then `:resize-pane -L 10` or `-R 10` |

## Skills Reference

| Skill | Purpose |
|-------|---------|
| `calendar` | Calendar display and meeting picker details |
| `document` | Document rendering and text selection |
| `flight` | Flight comparison and seat map details |
| `zmanim` | Jewish halachic times display |
| `table` | Tabular data display and selection |
| `json` | JSON tree explorer with expand/collapse |
| `kanban` | Task board with card management |
| `browser` | Terminal web browser with full JS support |
