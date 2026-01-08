// Table Canvas Types

// Column definition
export interface TableColumn {
  key: string;                               // Field name in row data
  label: string;                             // Display header
  width?: number;                            // Fixed width in chars (auto if undefined)
  type?: "string" | "number" | "date" | "boolean";
  align?: "left" | "center" | "right";       // Default: left for strings, right for numbers
}

// Table canvas configuration (from Claude)
export interface TableConfig {
  title?: string;                            // Optional table title
  columns: TableColumn[];                    // Column definitions
  rows: Array<Record<string, unknown>>;      // Row data

  // Behavior options
  sortable?: boolean;                        // Enable column sorting (default: false)
  showRowNumbers?: boolean;                  // Show row numbers column (default: true)
  pageSize?: number;                         // Rows per page, 0 = no pagination
  selectedRows?: number[];                   // Pre-selected row indices

  // Display options
  maxHeight?: number;                        // Max rows to display before scrolling
  emptyMessage?: string;                     // Message when no rows
}

// Single row selection result
export interface TableRowSelection {
  index: number;                             // 0-based row index
  data: Record<string, unknown>;             // Full row data
}

// Selection result (sent to Claude via IPC)
export interface TableSelectionResult {
  selectedRows: TableRowSelection[];
}

// Sort state
export interface SortState {
  columnKey: string;
  direction: "asc" | "desc";
}

// Internal: computed column with actual width
export interface ComputedColumn extends TableColumn {
  computedWidth: number;
}

// Style constants
export const TABLE_STYLES = {
  header: { bold: true, color: "cyan" },
  selectedRow: { backgroundColor: "blue" },
  hoveredRow: { backgroundColor: "gray" },
  rowNumber: { color: "gray", dimColor: true },
  border: { color: "gray" },
  statusBar: { color: "gray", dimColor: true },
} as const;

// Box drawing characters
export const BOX_CHARS = {
  topLeft: "┌",
  topRight: "┐",
  bottomLeft: "└",
  bottomRight: "┘",
  horizontal: "─",
  vertical: "│",
  headerSep: "├",
  headerSepRight: "┤",
  columnSep: "┼",
  topT: "┬",
  bottomT: "┴",
} as const;

// Utility: format cell value for display
export function formatCellValue(
  value: unknown,
  type?: TableColumn["type"]
): string {
  if (value === null || value === undefined) {
    return "";
  }

  switch (type) {
    case "number":
      return typeof value === "number" ? value.toLocaleString() : String(value);
    case "date":
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      if (typeof value === "string") {
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date.toLocaleDateString();
      }
      return String(value);
    case "boolean":
      return value ? "✓" : "✗";
    default:
      return String(value);
  }
}

// Utility: get default alignment for column type
export function getDefaultAlign(
  type?: TableColumn["type"]
): "left" | "center" | "right" {
  switch (type) {
    case "number":
      return "right";
    case "boolean":
      return "center";
    default:
      return "left";
  }
}

// Utility: pad string to width with alignment
export function padCell(
  text: string,
  width: number,
  align: "left" | "center" | "right"
): string {
  const truncated = text.length > width ? text.slice(0, width - 1) + "…" : text;
  const padding = width - truncated.length;

  switch (align) {
    case "right":
      return " ".repeat(padding) + truncated;
    case "center":
      const left = Math.floor(padding / 2);
      const right = padding - left;
      return " ".repeat(left) + truncated + " ".repeat(right);
    default:
      return truncated + " ".repeat(padding);
  }
}

// Utility: compute column widths based on content
export function computeColumnWidths(
  columns: TableColumn[],
  rows: Array<Record<string, unknown>>,
  availableWidth: number,
  showRowNumbers: boolean
): ComputedColumn[] {
  const ROW_NUM_WIDTH = 4; // "###" + space
  const BORDER_WIDTH = 1;  // "|" between columns
  const MIN_COL_WIDTH = 4;
  const PADDING = 2;       // 1 space on each side

  // Calculate space for row numbers
  const rowNumSpace = showRowNumbers ? ROW_NUM_WIDTH + BORDER_WIDTH : 0;

  // Calculate total fixed width and count flexible columns
  let fixedWidth = rowNumSpace;
  let flexibleCount = 0;

  for (const col of columns) {
    if (col.width) {
      fixedWidth += col.width + PADDING + BORDER_WIDTH;
    } else {
      flexibleCount++;
    }
  }

  // Calculate remaining width for flexible columns
  const remainingWidth = Math.max(0, availableWidth - fixedWidth - BORDER_WIDTH);
  const flexWidth = flexibleCount > 0
    ? Math.max(MIN_COL_WIDTH, Math.floor(remainingWidth / flexibleCount) - PADDING - BORDER_WIDTH)
    : 0;

  // Compute actual widths
  return columns.map((col) => {
    if (col.width) {
      return { ...col, computedWidth: col.width };
    }

    // Auto-size based on content
    let maxWidth = col.label.length;
    for (const row of rows.slice(0, 100)) { // Sample first 100 rows
      const value = formatCellValue(row[col.key], col.type);
      maxWidth = Math.max(maxWidth, value.length);
    }

    // Clamp to available flex width
    const computedWidth = Math.min(Math.max(MIN_COL_WIDTH, maxWidth), flexWidth);
    return { ...col, computedWidth };
  });
}
