# Canvas Plugin Development

Use Bun for all development:

- `bun run src/cli.ts` - Run CLI
- `bun test` - Run tests
- `bun install` - Install dependencies

## Available Canvases

| Canvas | Scenarios | Purpose |
|--------|-----------|---------|
| `calendar` | `display`, `meeting-picker` | Calendar views, time slot selection |
| `document` | `display`, `edit`, `email-preview` | Markdown viewer/editor |
| `flight` | `booking` | Flight search with seat selection |
| `zmanim` | `display` | Jewish halachic times |
| `table` | `display`, `select`, `multi-select` | Tabular data viewer |
| `json` | `explore`, `select` | JSON tree explorer |
| `kanban` | `display`, `select`, `manage` | Kanban board for tasks |
| `browser` | `display` | Terminal web browser (browsh) |

## Structure

```
canvas/
├── src/           # TypeScript source code
│   ├── cli.ts     # CLI entry point
│   ├── canvases/  # Canvas components (React/Ink)
│   ├── scenarios/ # Scenario definitions
│   ├── ipc/       # IPC server/client
│   └── api/       # High-level API
├── skills/        # Skill documentation
├── commands/      # User commands
└── package.json   # Plugin dependencies
```

## Adding a New Canvas Type

1. Create component in `src/canvases/`
2. Register scenarios in `src/scenarios/`
3. Add skill in `skills/[name]/SKILL.md`
4. Update main canvas skill

## Spawning with Selection Return

Use `spawnCanvasWithIPC` to spawn a canvas and get the user's selection back:

```typescript
import { spawnCanvasWithIPC } from "./src/api/canvas-api";

// Table selection
const result = await spawnCanvasWithIPC("table", "select", {
  title: "Pick an item",
  columns: [{key: "name", label: "Name"}],
  rows: [{name: "Option A"}, {name: "Option B"}]
});
// result.data.selectedRows[0].data

// JSON selection
const result = await spawnCanvasWithIPC("json", "explore", {
  title: "Select a value",
  data: { user: { name: "John", email: "john@example.com" } }
});
// result.data.path, result.data.value
```

## IPC Protocol

Canvases communicate via Unix domain sockets:

```typescript
// Canvas → Controller
{ type: "ready", scenario }
{ type: "selected", data }
{ type: "cancelled" }

// Controller → Canvas
{ type: "update", config }
{ type: "close" }
```
