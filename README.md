```
 ██████╗ ██████╗        █████╗ ██████╗ ██████╗ ███████╗
██╔════╝██╔════╝       ██╔══██╗██╔══██╗██╔══██╗██╔════╝
██║     ██║     █████╗ ███████║██████╔╝██████╔╝███████╗
██║     ██║     ╚════╝ ██╔══██║██╔═══╝ ██╔═══╝ ╚════██║
╚██████╗╚██████╗       ██║  ██║██║     ██║     ███████║
 ╚═════╝ ╚═════╝       ╚═╝  ╚═╝╚═╝     ╚═╝     ╚══════╝
```

Interactive terminal TUI components for Claude Code - calendars, documents, tables, JSON explorer, and more.

## Overview

A TUI toolkit that gives Claude Code its own display. Spawn interactive terminal interfaces in tmux split panes and receive user selections back into the conversation.

![Claude Canvas Screenshot](media/screenshot.png)

## Canvas Types

| Type | Scenarios | Description |
|------|-----------|-------------|
| `calendar` | `display`, `meeting-picker` | Display events, pick meeting times |
| `document` | `display`, `edit`, `email-preview` | View/edit markdown documents |
| `flight` | `booking` | Compare flights and select seats |
| `zmanim` | `display` | Jewish halachic times |
| `table` | `display`, `select`, `multi-select` | Tabular data with row selection |
| `json` | `explore`, `select` | JSON tree explorer with expand/collapse |
| `weather` | `display` | Weather forecast display |
| `chart` | `display`, `select` | Bar, line, and pie charts |
| `kanban` | `display`, `select`, `manage` | Kanban board for tasks |
| `browser` | `display` | Terminal web browser (browsh) |

## Requirements

### tmux
Canvas spawning requires a tmux session:

```bash
# macOS
brew install tmux

# Ubuntu/Debian
sudo apt install tmux
```

### Bun
Runtime for CLI commands:

```bash
curl -fsSL https://bun.sh/install | bash
```

### Claude Code
The Anthropic CLI for Claude:

```bash
npm install -g @anthropic-ai/claude-code
```

## Installation

Add this repository as a marketplace in Claude Code:

```
/plugin marketplace add gocodeweb/cc-apps
```

Then install the canvas plugin:

```
/plugin install cc-apps@cc-apps
```

## Usage

### 1. Start tmux session

```bash
tmux new -s claude
```

### 2. Launch Claude Code

```bash
claude
```

### 3. Try these example prompts

**Calendar:**
```
Show me a calendar for January 2025
```

**Table with selection:**
```
Show me a table with some sample users and let me pick one
```

**JSON Explorer:**
```
Let me explore this JSON: {"users": [{"name": "John", "age": 30}, {"name": "Jane", "age": 25}]}
```

**Document editing:**
```
Open a document editor with a markdown template
```

**Weather:**
```
Show me the weather for New York
```

**Chart:**
```
Show me a bar chart of monthly sales data
```

**Kanban:**
```
Create a kanban board with my project tasks
```

**GitHub Issues:**
```
Show me issues from anthropics/claude-code
```

## Credits

This project is inspired by and builds upon [dvdsgl/claude-canvas](https://github.com/dvdsgl/claude-canvas) - the original Claude Canvas implementation by David Siegel.

## License

MIT
