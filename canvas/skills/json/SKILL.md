---
name: json
description: |
  Interactive JSON/YAML tree explorer with expand/collapse.
  Use when navigating complex nested data structures, API responses, or config files.
---

# JSON Explorer Canvas

Interactive tree view for navigating and exploring JSON data structures.

## IMPORTANT: Spawn Immediately

When the user wants to explore JSON data:

```bash
bun run src/cli.ts spawn json --config '{
  "title": "API Response",
  "data": {"users": [{"name": "John", "age": 30}]},
  "expandDepth": 2
}'
```

## Scenarios

### `explore` (default)
Read-only tree navigation with expand/collapse. Perfect for understanding data structure.

### `select`
Navigate and select a specific value or path. Returns the selected path and value.

## Configuration

```typescript
interface JsonConfig {
  title?: string;           // Display title
  data: unknown;            // The JSON data to explore
  expandDepth?: number;     // Initial expand depth (default: 2)
  showPath?: boolean;       // Show current path in header (default: true)
  showTypes?: boolean;      // Show type hints like <string> (default: true)
}
```

## Selection Result

When using `select` scenario:

```typescript
interface JsonSelectionResult {
  path: string;                     // JSONPath string, e.g., "users[0].name"
  pathArray: (string | number)[];   // Path as array, e.g., ["users", 0, "name"]
  value: unknown;                   // The selected value
  type: "object" | "array" | "string" | "number" | "boolean" | "null";
}
```

## Controls

| Key | Action |
|-----|--------|
| `↑/k` | Move up |
| `↓/j` | Move down |
| `→/l` | Expand node |
| `←/h` | Collapse node |
| `Enter/Space` | Toggle expand/collapse |
| `e` | Expand all nodes |
| `c` | Collapse all nodes |
| `PageUp/Down` | Jump multiple rows |
| `g` | Jump to top |
| `G` | Jump to bottom |
| `q/Esc` | Quit |

## Visual Display

```
API Response
Path: users[0].address.city

▼ users: []
  ▼ [0]: {}
    ▶ name: "John" <string>
    ▶ age: 30 <number>
    ▼ address: {}
      ▶ city: "NYC" <string>    ← selected
      ▶ zip: "10001" <string>
  ▼ [1]: {}
    ▶ name: "Jane" <string>

↑↓ navigate · ←→ expand/collapse · e/c all · q quit     5/12
```

## Examples

### Explore API response:
```bash
bun run src/cli.ts spawn json --config '{
  "title": "User Data",
  "data": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "settings": {
      "theme": "dark",
      "notifications": true
    },
    "roles": ["admin", "user"]
  }
}'
```

### Explore deeply nested config:
```bash
bun run src/cli.ts spawn json --config '{
  "title": "package.json",
  "data": '"$(cat package.json)"',
  "expandDepth": 1
}'
```

### Select a value:
```bash
bun run src/cli.ts spawn json --scenario select --config '{
  "title": "Select a field",
  "data": {"name": "John", "email": "john@example.com", "phone": "555-1234"}
}'
```

## Color Coding

| Type | Color |
|------|-------|
| Keys | Cyan |
| Strings | Green |
| Numbers | Yellow |
| Booleans | Magenta |
| Null | Gray |
| Brackets | White |

## Use Cases

- **API debugging**: Explore complex API responses
- **Config inspection**: Navigate deeply nested configuration files
- **Data analysis**: Understand JSON data structure before processing
- **Path selection**: Select a specific path for further operations
- **Documentation**: Visualize data schemas
