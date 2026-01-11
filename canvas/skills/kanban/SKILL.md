---
name: kanban
description: |
  Kanban board canvas for displaying and managing tasks in columns.
  Use when showing task boards, sprint boards, or any workflow visualization.
---

# Kanban Canvas

Interactive Kanban board for displaying tasks organized in columns with cards.

## IMPORTANT: Spawn Immediately

When the user asks to "show a kanban board" or you have task data to display:

1. Organize tasks into columns (e.g., "To Do", "In Progress", "Done")
2. Spawn the kanban canvas with appropriate scenario

### Quick display example:
```bash
bun run src/cli.ts spawn kanban --scenario display --config '{
  "title": "Sprint Board",
  "columns": [
    {"id": "todo", "title": "To Do", "cards": [
      {"id": "1", "title": "Fix login bug", "priority": "high"}
    ]},
    {"id": "doing", "title": "In Progress", "cards": []},
    {"id": "done", "title": "Done", "cards": []}
  ]
}'
```

## Scenarios

### `display` (default)
View-only Kanban board. User can navigate but cannot move cards.
- Use for: showing task status, project overview, workflow visualization

### `select`
Card selection mode. Closes when user selects a card with Enter.
- Use for: picking a task to work on, selecting an item to discuss
- Returns: the selected card with column context

### `manage`
Card management mode. User can move cards between columns.
- Use for: updating task status, sprint planning, workflow management
- Returns: move history and updated board state

## Configuration

```typescript
interface KanbanConfig {
  title?: string;                    // Board title
  columns: KanbanColumn[];           // Column definitions with cards
  labels?: KanbanLabel[];            // Label definitions for color coding

  // Display options
  showDescription?: boolean;         // Show card descriptions (default: true)
  showLabels?: boolean;              // Show labels on cards (default: true)
  showCardCount?: boolean;           // Show count in headers (default: true)
  showWipLimit?: boolean;            // Show WIP limits (default: true)
  maxCardTitleLength?: number;       // Truncate titles (default: 40)
  maxDescriptionLength?: number;     // Truncate descriptions (default: 60)
  columnWidth?: number;              // Fixed column width (auto if omitted)
}

interface KanbanColumn {
  id: string;                        // Unique column identifier
  title: string;                     // Column header
  cards: KanbanCard[];               // Cards in this column
  color?: string;                    // Header color (cyan, green, red, etc.)
  wipLimit?: number;                 // Work-in-progress limit
}

interface KanbanCard {
  id: string;                        // Unique card identifier
  title: string;                     // Card title
  description?: string;              // Card description
  labels?: string[];                 // Array of label IDs
  priority?: "low" | "medium" | "high" | "urgent";
  dueDate?: string;                  // ISO date string
  assignee?: string;                 // Assigned person
}

interface KanbanLabel {
  id: string;                        // Label identifier
  name: string;                      // Label display name
  color: string;                     // Ink color (red, green, blue, yellow, etc.)
}
```

## Selection Result

### `select` scenario:
```typescript
interface KanbanSelectionResult {
  type: "card-selected";
  selection: {
    card: KanbanCard;                // Selected card data
    columnId: string;                // Column where card was selected
    columnTitle: string;             // Column title
    cardIndex: number;               // Index within column
  };
}
```

### `manage` scenario:
```typescript
interface KanbanMoveConfirmResult {
  type: "cards-moved";
  moves: Array<{
    card: KanbanCard;                // Card that was moved
    fromColumn: string;              // Source column ID
    toColumn: string;                // Target column ID
    fromIndex: number;               // Original position
    toIndex: number;                 // New position
  }>;
  updatedColumns: KanbanColumn[];    // Final board state
}
```

## Controls

| Key | Action | Scenario |
|-----|--------|----------|
| `←/h` | Previous column | All |
| `→/l` | Next column | All |
| `↑/k` | Previous card | All |
| `↓/j` | Next card | All |
| `g` | First card in column | All |
| `G` | Last card in column | All |
| `0` | First column | All |
| `$` | Last column | All |
| `Space` | Preview card details | display, select |
| `Enter` | Select card / Confirm moves | select, manage |
| `H` | Move card to previous column | manage |
| `L` | Move card to next column | manage |
| `1-9` | Move card to column N | manage |
| `u` | Undo last move | manage |
| `q/Esc` | Quit | All |

## Examples

### Sprint Board Display:
```bash
bun run src/cli.ts spawn kanban --config '{
  "title": "Sprint 23",
  "labels": [
    {"id": "bug", "name": "Bug", "color": "red"},
    {"id": "feature", "name": "Feature", "color": "green"},
    {"id": "docs", "name": "Docs", "color": "blue"}
  ],
  "columns": [
    {
      "id": "backlog",
      "title": "Backlog",
      "cards": [
        {"id": "1", "title": "Research caching strategies", "labels": ["feature"], "priority": "low"},
        {"id": "2", "title": "Update API docs", "labels": ["docs"]}
      ]
    },
    {
      "id": "todo",
      "title": "To Do",
      "wipLimit": 5,
      "cards": [
        {"id": "3", "title": "Fix login timeout", "labels": ["bug"], "priority": "high", "assignee": "alice"},
        {"id": "4", "title": "Add dark mode", "labels": ["feature"], "priority": "medium"}
      ]
    },
    {
      "id": "doing",
      "title": "In Progress",
      "wipLimit": 3,
      "cards": [
        {"id": "5", "title": "OAuth integration", "description": "Add Google and GitHub login", "labels": ["feature"], "priority": "high"}
      ]
    },
    {
      "id": "done",
      "title": "Done",
      "color": "green",
      "cards": [
        {"id": "6", "title": "Setup CI/CD", "labels": ["feature"]}
      ]
    }
  ]
}'
```

### Task Selection:
```bash
bun run src/cli.ts spawn kanban --scenario select --config '{
  "title": "Pick a task to work on",
  "columns": [
    {
      "id": "available",
      "title": "Available Tasks",
      "cards": [
        {"id": "1", "title": "Fix navbar alignment", "priority": "low"},
        {"id": "2", "title": "Add unit tests", "priority": "medium"},
        {"id": "3", "title": "Optimize queries", "priority": "high"}
      ]
    },
    {
      "id": "assigned",
      "title": "Already Assigned",
      "cards": [
        {"id": "4", "title": "Design landing page", "assignee": "bob"}
      ]
    }
  ]
}'
```

### Manage Board:
```bash
bun run src/cli.ts spawn kanban --scenario manage --config '{
  "title": "Manage Sprint Board",
  "columns": [
    {"id": "todo", "title": "To Do", "wipLimit": 10, "cards": [
      {"id": "1", "title": "Task A", "priority": "medium"},
      {"id": "2", "title": "Task B", "priority": "low"}
    ]},
    {"id": "doing", "title": "In Progress", "wipLimit": 3, "cards": [
      {"id": "3", "title": "Task C", "priority": "high"}
    ]},
    {"id": "review", "title": "In Review", "wipLimit": 2, "cards": []},
    {"id": "done", "title": "Done", "cards": []}
  ]
}'
```

## Visual Indicators

| Indicator | Meaning |
|-----------|---------|
| `○` | Low priority |
| `◐` | Medium priority |
| `●` | High priority |
| `◉` | Urgent priority |
| `●●●` | Labels (colored dots) |
| `[3/5]` | WIP limit (current/max) |
| Yellow header | WIP at limit |
| Red header | WIP exceeded |

## Use Cases

- **Sprint planning**: Organize tasks into sprints and track progress
- **Project management**: Visualize workflow status
- **Task selection**: Let users pick tasks to work on
- **Status updates**: Move cards between columns to update status
- **Team boards**: Show who is working on what
- **Workflow visualization**: Display any multi-stage process
