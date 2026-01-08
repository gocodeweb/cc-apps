---
name: chart
description: |
  Display data visualizations with bar, line, and pie charts.
  Use when showing metrics, trends, distributions, or comparisons.
---

# Chart Canvas

Interactive chart viewer for data visualization in the terminal.

## IMPORTANT: Spawn Immediately

When the user asks to "show a chart" or you have data to visualize:

1. Determine the best chart type for the data
2. Format data as series with labels and values
3. Spawn the chart canvas

### Quick bar chart example:
```bash
bun run src/cli.ts spawn chart --config '{
  "type": "bar",
  "title": "Sales by Quarter",
  "series": [{
    "name": "Revenue",
    "data": [
      {"label": "Q1", "value": 100},
      {"label": "Q2", "value": 150},
      {"label": "Q3", "value": 120},
      {"label": "Q4", "value": 180}
    ]
  }]
}'
```

## Chart Types

### `bar` (vertical)
Vertical bar chart - best for comparing categories.
```bash
bun run src/cli.ts spawn chart --config '{
  "type": "bar",
  "title": "Monthly Users",
  "series": [{"name": "Users", "data": [
    {"label": "Jan", "value": 1200},
    {"label": "Feb", "value": 1500},
    {"label": "Mar", "value": 1800}
  ]}]
}'
```

### `bar-horizontal`
Horizontal bar chart - best for ranked data or long labels.
```bash
bun run src/cli.ts spawn chart --config '{
  "type": "bar-horizontal",
  "title": "Top Languages",
  "series": [{"name": "Repos", "data": [
    {"label": "JavaScript", "value": 2500},
    {"label": "Python", "value": 2100},
    {"label": "TypeScript", "value": 1800},
    {"label": "Go", "value": 900}
  ]}]
}'
```

### `line`
Line chart - best for trends over time.
```bash
bun run src/cli.ts spawn chart --config '{
  "type": "line",
  "title": "Temperature Trend",
  "series": [{"name": "Temp", "data": [
    {"label": "Mon", "value": 72},
    {"label": "Tue", "value": 75},
    {"label": "Wed", "value": 71},
    {"label": "Thu", "value": 78},
    {"label": "Fri", "value": 82}
  ]}]
}'
```

### `pie`
Pie chart - best for showing proportions of a whole.
```bash
bun run src/cli.ts spawn chart --config '{
  "type": "pie",
  "title": "Market Share",
  "series": [{"name": "Share", "data": [
    {"label": "Chrome", "value": 65},
    {"label": "Safari", "value": 19},
    {"label": "Firefox", "value": 8},
    {"label": "Other", "value": 8}
  ]}]
}'
```

## Scenarios

### `display` (default)
View-only chart display. User can navigate but cannot select data points.
- Use for: showing metrics, trends, reports

### `select`
Data point selection mode. User navigates and selects with Enter.
- Use for: drilling down into specific data points
- Returns: the selected data point details

## Configuration

```typescript
interface ChartConfig {
  title?: string;                    // Chart title
  type: "bar" | "bar-horizontal" | "line" | "pie";
  series: DataSeries[];              // Data series

  // Display options
  showLegend?: boolean;              // Show legend (default: true for multi-series)
  showValues?: boolean;              // Show value labels (default: true)
  showGrid?: boolean;                // Show grid lines (default: true)

  // Axis options (bar/line charts)
  xAxisLabel?: string;               // X-axis label
  yAxisLabel?: string;               // Y-axis label
  yMin?: number;                     // Y-axis minimum
  yMax?: number;                     // Y-axis maximum

  // Line chart specific
  height?: number;                   // Chart height in lines

  // Color palette
  colors?: string[];                 // Custom colors
}

interface DataSeries {
  name: string;                      // Series name
  data: DataPoint[];                 // Data points
  color?: string;                    // Series color
}

interface DataPoint {
  label: string;                     // Category/X label
  value: number;                     // Numeric value
  color?: string;                    // Point-specific color
}
```

## Selection Result

When using `select` scenario:

```typescript
interface ChartSelectionResult {
  selectedPoints: Array<{
    seriesIndex: number;             // Series index
    seriesName: string;              // Series name
    pointIndex: number;              // Point index in series
    label: string;                   // Data point label
    value: number;                   // Data point value
  }>;
}
```

## Controls

| Key | Action |
|-----|--------|
| `←/h` | Previous point (bar, line) |
| `→/l` | Next point (bar, line) |
| `↑/k` | Previous item (bar-horizontal, pie) |
| `↓/j` | Next item (bar-horizontal, pie) |
| `g` | Jump to first point |
| `G` | Jump to last point |
| `PageUp` | Jump back 10 points |
| `PageDown` | Jump forward 10 points |
| `Enter` | Select point (select mode) |
| `q/Esc` | Quit |

## Colors

Available colors: `green`, `blue`, `yellow`, `magenta`, `cyan`, `red`, `white`

Custom palette:
```json
{
  "colors": ["cyan", "magenta", "yellow"]
}
```

Per-point colors:
```json
{
  "data": [
    {"label": "Success", "value": 80, "color": "green"},
    {"label": "Warning", "value": 15, "color": "yellow"},
    {"label": "Error", "value": 5, "color": "red"}
  ]
}
```

## Examples

### Multi-series line chart:
```bash
bun run src/cli.ts spawn chart --config '{
  "type": "line",
  "title": "Website Traffic",
  "series": [
    {"name": "Visitors", "data": [
      {"label": "Mon", "value": 1200},
      {"label": "Tue", "value": 1400},
      {"label": "Wed", "value": 1100}
    ]},
    {"name": "Page Views", "data": [
      {"label": "Mon", "value": 3600},
      {"label": "Tue", "value": 4200},
      {"label": "Wed", "value": 3300}
    ]}
  ],
  "showLegend": true
}'
```

### Selection mode:
```bash
bun run src/cli.ts spawn chart --scenario select --config '{
  "type": "bar-horizontal",
  "title": "Select a category",
  "series": [{"name": "Count", "data": [
    {"label": "Category A", "value": 42},
    {"label": "Category B", "value": 38},
    {"label": "Category C", "value": 25}
  ]}]
}'
```

## Use Cases

- **Metrics dashboards**: Display KPIs and performance data
- **Trend analysis**: Show data over time with line charts
- **Comparisons**: Compare values across categories with bar charts
- **Distributions**: Show proportions with pie charts
- **Data exploration**: Let users select data points to drill down
