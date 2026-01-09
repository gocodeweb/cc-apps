# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CC Apps is a TUI toolkit that gives Claude Code its own display via tmux split panes. It spawns interactive terminal interfaces (React/Ink components) for calendars, documents, charts, tables, JSON explorer, and more.

**Requirements:** Bun, tmux

## Commands

```bash
# Run canvas in current terminal
bun run start show calendar

# Spawn canvas in tmux split pane
bun run spawn calendar --scenario meeting-picker --config '{...}'

# Test all
bun test

# Run from canvas workspace
cd canvas && bun run src/cli.ts show document --scenario edit
```

## Architecture

The system has three layers:

1. **CLI** (`canvas/src/cli.ts`) - Entry point, parses commands, delegates to canvases
2. **Canvases** (`canvas/src/canvases/`) - React/Ink TUI components (calendar, document, flight, zmanim, table, json, weather, chart, browser)
3. **IPC** (`canvas/src/ipc/`) - Unix socket communication between Claude and spawned canvases

### Canvas Types and Scenarios

Each canvas type supports multiple scenarios (interaction modes):

| Canvas | Scenarios |
|--------|-----------|
| calendar | `display`, `meeting-picker` |
| document | `display`, `edit`, `email-preview` |
| flight | `booking` |
| zmanim | `display` |
| table | `display`, `select`, `multi-select` |
| json | `explore`, `select` |
| weather | `display` |
| chart | `display`, `select` |
| browser | `display` |

### Key Flows

**Spawning a canvas:**
1. `spawnCanvas()` in `terminal.ts` creates/reuses a tmux split pane
2. Canvas process starts, creates IPC server via Unix socket at `/tmp/canvas-{id}.sock`
3. Canvas sends `{ type: "ready" }` when initialized
4. User interacts; canvas sends `{ type: "selected", data }` or `{ type: "cancelled" }`

**IPC Protocol** (defined in `canvas/src/ipc/types.ts`):
- Canvas → Controller: `ready`, `selected`, `cancelled`, `error`, `selection`, `content`
- Controller → Canvas: `update`, `close`, `ping`, `getSelection`, `getContent`

### Adding a New Canvas Type

1. Create component in `canvas/src/canvases/[name].tsx`
2. Add types in `canvas/src/canvases/[name]/types.ts`
3. Create scenarios in `canvas/src/scenarios/[name]/`
4. Register in `canvas/src/scenarios/registry.ts`
5. Add render function in `canvas/src/canvases/index.tsx`
6. Add skill documentation in `canvas/skills/[name]/SKILL.md`

## Bun Guidelines

Use Bun instead of Node.js:

- `bun <file>` instead of `node` or `ts-node`
- `bun test` instead of `jest` or `vitest`
- `bun install` instead of `npm/yarn/pnpm install`
- Bun auto-loads `.env` - don't use dotenv

Prefer Bun APIs:
- `Bun.serve()` for HTTP/WebSocket (not express)
- `Bun.file()` over `node:fs` readFile/writeFile
- `Bun.connect()` for Unix sockets
- `Bun.$\`cmd\`` instead of execa
