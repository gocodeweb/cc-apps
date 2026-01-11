// Kanban Canvas Types

// Label/Tag definition for color-coded cards
export interface KanbanLabel {
  id: string;
  name: string;
  color: string; // Ink color: "red", "green", "blue", "yellow", "magenta", "cyan", "white"
}

// Card definition
export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  body?: string; // Full content for preview (e.g., full issue markdown)
  labels?: string[]; // Array of label IDs
  priority?: "low" | "medium" | "high" | "urgent";
  dueDate?: string; // ISO date string
  assignee?: string;
  metadata?: Record<string, unknown>; // Custom fields
}

// Column definition
export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
  color?: string; // Optional column header color
  wipLimit?: number; // Work-in-progress limit
}

// Canvas configuration (from Claude)
export interface KanbanConfig {
  title?: string;
  columns: KanbanColumn[];
  labels?: KanbanLabel[]; // Label definitions for color coding

  // Display options
  showDescription?: boolean; // Show card descriptions (default: true, truncated)
  showLabels?: boolean; // Show labels on cards (default: true)
  showCardCount?: boolean; // Show count in column headers (default: true)
  showWipLimit?: boolean; // Show WIP limits (default: true if limits defined)
  maxCardTitleLength?: number; // Truncate titles (default: 40)
  maxDescriptionLength?: number; // Truncate descriptions (default: 60)
  columnWidth?: number; // Fixed column width (auto if omitted)
}

// Navigation position
export interface KanbanPosition {
  columnIndex: number;
  cardIndex: number; // -1 means column header is selected
}

// Card selection result
export interface KanbanCardSelection {
  card: KanbanCard;
  columnId: string;
  columnTitle: string;
  cardIndex: number;
}

// Move result for manage scenario
export interface KanbanMoveResult {
  card: KanbanCard;
  fromColumn: string; // Column ID
  toColumn: string; // Column ID
  fromIndex: number;
  toIndex: number;
}

// Selection result (sent to Claude via IPC)
export interface KanbanSelectionResult {
  type: "card-selected";
  selection: KanbanCardSelection;
}

// Manage confirm result
export interface KanbanMoveConfirmResult {
  type: "cards-moved";
  moves: KanbanMoveResult[];
  updatedColumns: KanbanColumn[];
}

// Preview result (for Space key - doesn't exit)
export interface KanbanPreviewResult {
  type: "card-preview";
  selection: KanbanCardSelection;
}

// Union type for all results
export type KanbanResult = KanbanSelectionResult | KanbanMoveConfirmResult | KanbanPreviewResult;

// Style constants
export const KANBAN_STYLES = {
  columnHeader: { bold: true, color: "cyan" as const },
  selectedColumn: { borderColor: "blue" as const },
  cardTitle: { bold: true },
  cardDescription: { dimColor: true },
  selectedCard: { backgroundColor: "blue" as const },
  wipWarning: { color: "yellow" as const },
  wipExceeded: { color: "red" as const },
} as const;

// Priority indicators
export const PRIORITY_ICONS: Record<string, string> = {
  low: "○",
  medium: "◐",
  high: "●",
  urgent: "◉",
};

// Label marker
export const LABEL_MARKER = "●";

// Utility: truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + "…";
}

// Utility: get WIP status for a column
export function getColumnWipStatus(
  column: KanbanColumn
): "normal" | "warning" | "exceeded" {
  if (!column.wipLimit) return "normal";
  const count = column.cards.length;
  if (count > column.wipLimit) return "exceeded";
  if (count === column.wipLimit) return "warning";
  return "normal";
}

// Utility: get label color by ID
export function getLabelColor(
  labelId: string,
  labels?: KanbanLabel[]
): string {
  const label = labels?.find((l) => l.id === labelId);
  return label?.color || "gray";
}

// Utility: compute optimal column width
export function computeColumnWidth(
  columnCount: number,
  terminalWidth: number,
  fixedWidth?: number
): number {
  if (fixedWidth) return fixedWidth;

  const minWidth = 20;
  const maxWidth = 40;
  const gapWidth = columnCount > 1 ? columnCount - 1 : 0; // 1 char gap between columns
  const padding = 2; // Outer padding

  const availableWidth = terminalWidth - gapWidth - padding;
  const calculatedWidth = Math.floor(availableWidth / columnCount);

  return Math.max(minWidth, Math.min(maxWidth, calculatedWidth));
}

// Utility: deep clone columns for local editing
export function cloneColumns(columns: KanbanColumn[]): KanbanColumn[] {
  return columns.map((col) => ({
    ...col,
    cards: col.cards.map((card) => ({ ...card })),
  }));
}
