---
name: github-issues
description: |
  Browse GitHub issues in an interactive kanban board.
  Use when the user wants to view, browse, or triage GitHub issues.
---

# GitHub Issues Kanban

Fetches GitHub issues and displays them in an interactive kanban board. When user selects an issue, shows the full issue content in a document canvas.

## IMPORTANT: Use This Skill Automatically

When the user asks to:
- "Show issues from [repo]"
- "Browse GitHub issues"
- "Show claude-code issues"
- "Triage issues"

**Spawn immediately:**

```bash
cd ${CLAUDE_PLUGIN_ROOT}
bun run src/cli.ts github-issues --repo owner/repo
```

## Usage

```bash
# Default: anthropics/claude-code
bun run src/cli.ts github-issues

# Specific repo
bun run src/cli.ts github-issues --repo vercel/next.js

# Limit number of issues
bun run src/cli.ts github-issues --repo anthropics/claude-code --limit 50
```

## How It Works

1. Fetches issues from GitHub using `gh` CLI
2. Categorizes into columns: Bugs, Features, Docs, Other
3. Displays in kanban with select mode
4. **Space** to preview: Shows full issue markdown, then returns to kanban
5. **Enter** to select: Exits and returns the selected issue to Claude Code for discussion
6. **q/Esc** to quit

## Controls

In kanban:
- `←→` / `h l` - Switch columns
- `↑↓` / `j k` - Navigate cards
- `Space` - Preview issue (shows full markdown, returns to kanban)
- `Enter` - Select issue and return to chat
- `q` / `Esc` - Quit

In document preview:
- `↑↓` / `j k` - Scroll
- `q` / `Esc` - Close and return to kanban

## Requirements

- `gh` CLI installed and authenticated
- Access to the repository

## Examples

```bash
# Claude Code issues
bun run src/cli.ts github-issues --repo anthropics/claude-code

# React issues
bun run src/cli.ts github-issues --repo facebook/react --limit 40

# Your own repo
bun run src/cli.ts github-issues --repo myuser/myrepo
```
