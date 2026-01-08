---
name: table
description: |
  Display tabular data in an interactive table view.
  Use when showing JSON arrays, CSV data, API responses, or any structured data.
---

# Table Canvas

Interactive table viewer for displaying and selecting from tabular data.

## IMPORTANT: Spawn Immediately

When the user asks to "show data in a table" or you have structured data to display:

1. Convert the data to rows and columns format
2. Spawn the table canvas with appropriate scenario

### Quick display example:
```bash
bun run src/cli.ts spawn table --scenario display --config '{
  "title": "API Response",
  "columns": [
    {"key": "id", "label": "ID", "type": "number"},
    {"key": "name", "label": "Name"},
    {"key": "status", "label": "Status"}
  ],
  "rows": [
    {"id": 1, "name": "Item One", "status": "active"},
    {"id": 2, "name": "Item Two", "status": "pending"}
  ]
}'
```

## Scenarios

### `display` (default)
View-only table display. User can navigate and scroll but cannot select rows.
- Use for: showing query results, API responses, log entries

### `select`
Single row selection mode. Closes when user selects a row with Enter.
- Use for: picking one item from a list
- Returns: the selected row data

### `multi-select`
Multiple row selection mode. User toggles rows with Space, confirms with Enter.
- Use for: batch operations, selecting multiple items
- Returns: array of selected rows

## Configuration

```typescript
interface TableConfig {
  title?: string;              // Table title (displays row count)
  columns: TableColumn[];      // Column definitions
  rows: Record<string, unknown>[]; // Row data

  // Behavior options
  sortable?: boolean;          // Enable column sorting with 's' key
  showRowNumbers?: boolean;    // Show row numbers (default: true)
  selectedRows?: number[];     // Pre-selected row indices (multi-select)
  emptyMessage?: string;       // Message when no rows
}

interface TableColumn {
  key: string;                 // Field name in row data
  label: string;               // Display header
  width?: number;              // Fixed width in chars (auto if omitted)
  type?: "string" | "number" | "date" | "boolean";
  align?: "left" | "center" | "right";
}
```

## Selection Result

When using `select` or `multi-select` scenarios:

```typescript
interface TableSelectionResult {
  selectedRows: Array<{
    index: number;             // 0-based row index
    data: Record<string, unknown>; // Full row data
  }>;
}
```

## Controls

| Key | Action |
|-----|--------|
| `↑/k` | Move up one row |
| `↓/j` | Move down one row |
| `←/h` | Scroll left (wide tables) |
| `→/l` | Scroll right (wide tables) |
| `PageUp` | Move up 10 rows |
| `PageDown` | Move down 10 rows |
| `g` | Jump to first row |
| `G` | Jump to last row |
| `Enter` | Select row (select mode) / Confirm selection (multi-select) |
| `Space` | Toggle row selection (multi-select only) |
| `s` | Cycle sort column (if sortable) |
| `q/Esc` | Quit |

## Examples

### Display JSON array:
```bash
bun run src/cli.ts spawn table --config '{
  "title": "Users",
  "columns": [
    {"key": "id", "label": "ID", "type": "number", "width": 6},
    {"key": "name", "label": "Name", "width": 20},
    {"key": "email", "label": "Email"},
    {"key": "active", "label": "Active", "type": "boolean"}
  ],
  "rows": [
    {"id": 1, "name": "John Doe", "email": "john@example.com", "active": true},
    {"id": 2, "name": "Jane Smith", "email": "jane@example.com", "active": false}
  ],
  "sortable": true
}'
```

### Single selection:
```bash
bun run src/cli.ts spawn table --scenario select --config '{
  "title": "Select a file",
  "columns": [
    {"key": "name", "label": "Filename"},
    {"key": "size", "label": "Size", "type": "number"},
    {"key": "modified", "label": "Modified", "type": "date"}
  ],
  "rows": [
    {"name": "package.json", "size": 1024, "modified": "2024-01-15"},
    {"name": "README.md", "size": 2048, "modified": "2024-01-14"}
  ]
}'
```

### Multi-select with pre-selection:
```bash
bun run src/cli.ts spawn table --scenario multi-select --config '{
  "title": "Select items to delete",
  "columns": [
    {"key": "name", "label": "Name"},
    {"key": "type", "label": "Type"}
  ],
  "rows": [
    {"name": "temp.txt", "type": "file"},
    {"name": "cache", "type": "dir"},
    {"name": "logs", "type": "dir"}
  ],
  "selectedRows": [0, 1]
}'
```

## Column Types

| Type | Formatting | Default Align |
|------|-----------|---------------|
| `string` | As-is | left |
| `number` | Locale formatting (1,234) | right |
| `date` | Locale date format | left |
| `boolean` | ✓ / ✗ | center |

## Use Cases

- **API responses**: Display JSON arrays from fetch/curl
- **Database queries**: Show SQL query results
- **File listings**: Display directory contents with metadata
- **Log entries**: Show structured log data
- **Configuration**: Display key-value pairs
- **Selection dialogs**: Let user pick from options
