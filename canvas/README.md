# 🎨 CC Apps (Canvas Plugin)

> Interactive terminal TUI components for Claude Code - calendars, documents, tables, JSON explorer, browser, and more!

## ✨ Overview

Canvas provides spawnable terminal displays with real-time IPC communication. Claude can spawn these TUIs in tmux split panes and receive user selections back into the conversation.

## 🧩 Canvas Types

| Type | Scenarios | Description |
|------|-----------|-------------|
| 📅 `calendar` | `display`, `meeting-picker` | Display events, pick meeting times |
| 📄 `document` | `display`, `edit`, `email-preview` | View/edit markdown documents |
| ✈️ `flight` | `booking` | Compare flights and select seats |
| 🕐 `zmanim` | `display` | Jewish halachic times |
| 📊 `table` | `display`, `select`, `multi-select` | Tabular data with row selection |
| 🔍 `json` | `explore`, `select` | JSON tree explorer with expand/collapse |
| 📋 `kanban` | `display`, `select`, `manage` | Kanban board with card management |
| 🌤️ `weather` | `display` | Weather forecast display |
| 📈 `chart` | `display`, `select` | Bar, line, and pie charts |
| 🌐 `browser` | `display` | Terminal web browser (browsh) |

## 📋 Requirements

### 🖥️ tmux
Canvas spawning requires a tmux session. Install tmux:

```bash
# macOS
brew install tmux

# Ubuntu/Debian
sudo apt install tmux

# Arch Linux
sudo pacman -S tmux
```

### 🥟 Bun
Runtime for CLI commands. Install Bun:

```bash
curl -fsSL https://bun.sh/install | bash
```

### 🤖 Claude Code
The Anthropic CLI for Claude. Install Claude Code:

```bash
npm install -g @anthropic-ai/claude-code
```

### 🖱️ Terminal with mouse support
For interactive scenarios (clicking, selecting). Most modern terminals support this (iTerm2, Alacritty, kitty, Windows Terminal).

## 🚀 Installation

### From Claude Code Marketplace (Recommended)

Add this repository as a marketplace in Claude Code:

```
/plugin marketplace add eladcandroid/cc-apps
```

Then install the cc-apps plugin:

```
/plugin install cc-apps
```

### Manual Installation

```bash
# Clone the repo
git clone https://github.com/eladcandroid/cc-apps.git
cd cc-apps/canvas

# Install dependencies
bun install
```

## 💡 Usage

### 1️⃣ Start tmux session

```bash
tmux new -s claude
```

### 2️⃣ Launch Claude Code

```bash
claude
```

### 3️⃣ Try these example prompts

📅 **Calendar:**
```
Show me a calendar for January 2025
```

📊 **Table with selection:**
```
Show me a table with some sample users and let me pick one
```

🔍 **JSON Explorer:**
```
Let me explore this JSON: {"users": [{"name": "John", "age": 30}, {"name": "Jane", "age": 25}]}
```

📄 **Document editing:**
```
Open a document editor with a markdown template
```

🗓️ **Meeting picker:**
```
Help me pick a meeting time, show available slots for this week
```

🌐 **Browser:**
```
Open a browser to localhost:3000
```

📋 **Kanban board:**
```
Show me a kanban board with some tasks
```

🐙 **GitHub issues:**
```
Show issues from anthropics/claude-code
```

### ⌨️ Direct CLI usage

```bash
# Show calendar in current terminal
bun run src/cli.ts show calendar

# Spawn table picker in tmux split
bun run src/cli.ts spawn table --scenario select --config '{"title": "Pick a user", "columns": [{"key": "name", "label": "Name"}], "rows": [{"name": "Alice"}, {"name": "Bob"}]}'

# Spawn JSON explorer
bun run src/cli.ts spawn json --config '{"title": "API Response", "data": {"status": "ok", "items": [1, 2, 3]}}'

# Spawn browser to URL
bun run src/cli.ts browser --url "http://localhost:3000"

# Spawn browser with Firefox GUI (for DevTools)
bun run src/cli.ts browser --url "http://localhost:3000" --gui
```

## 📚 Skills

| Skill | Description |
|-------|-------------|
| 🎨 `canvas` | Main skill with overview and IPC details |
| 📅 `calendar` | Calendar display and meeting picker |
| 📄 `document` | Markdown rendering and text selection |
| ✈️ `flight` | Flight comparison and seatmaps |
| 🕐 `zmanim` | Jewish halachic times display |
| 📊 `table` | Tabular data display and selection |
| 🔍 `json` | JSON tree explorer with expand/collapse |
| 📋 `kanban` | Kanban board with card management |
| 🌤️ `weather` | Weather forecast display |
| 📈 `chart` | Bar, line, and pie chart visualization |
| 🌐 `browser` | Terminal web browser (browsh) |
| 🐙 `github-issues` | Browse GitHub issues in kanban board |

## 🙏 Credits

This project is inspired by and builds upon [dvdsgl/claude-canvas](https://github.com/dvdsgl/claude-canvas) - the original Claude Canvas implementation by David Siegel.

## 📄 License

MIT
