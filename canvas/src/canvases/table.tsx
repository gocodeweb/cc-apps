// Table Canvas - Tabular data viewer

import React, { useState, useEffect, useCallback } from "react";
import { Box, Text, useInput, useApp, useStdout } from "ink";
import { useIPCServer } from "./calendar/hooks/use-ipc-server";
import type {
  TableConfig,
  TableSelectionResult,
  TableRowSelection,
  SortState,
  ComputedColumn,
} from "./table/types";
import {
  formatCellValue,
  getDefaultAlign,
  padCell,
  computeColumnWidths,
  BOX_CHARS,
} from "./table/types";

interface Props {
  id: string;
  config?: TableConfig;
  socketPath?: string;
  scenario?: string;
}

export function Table({ id, config: initialConfig, socketPath, scenario = "display" }: Props) {
  const { exit } = useApp();
  const { stdout } = useStdout();

  // Terminal dimensions
  const [dimensions, setDimensions] = useState({
    width: stdout?.columns || 80,
    height: stdout?.rows || 24,
  });

  // Live config state (can be updated via IPC)
  const [liveConfig, setLiveConfig] = useState<TableConfig | undefined>(initialConfig);

  // Navigation state
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [horizontalScroll, setHorizontalScroll] = useState(0);

  // Multi-select state
  const [selectedRows, setSelectedRows] = useState<Set<number>>(
    new Set(initialConfig?.selectedRows || [])
  );

  // Sort state
  const [sortState, setSortState] = useState<SortState | null>(null);

  // IPC for communicating with Claude
  const ipc = useIPCServer({
    socketPath,
    scenario: scenario || "display",
    onClose: () => exit(),
    onUpdate: (newConfig) => {
      setLiveConfig(newConfig as TableConfig);
      // Reset selection when data changes
      setSelectedRowIndex(0);
      setScrollOffset(0);
      setSelectedRows(new Set((newConfig as TableConfig)?.selectedRows || []));
    },
  });

  // Listen for terminal resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: stdout?.columns || 80,
        height: stdout?.rows || 24,
      });
    };
    stdout?.on("resize", updateDimensions);
    updateDimensions();
    return () => {
      stdout?.off("resize", updateDimensions);
    };
  }, [stdout]);

  // Config with defaults
  const config = liveConfig || {
    columns: [],
    rows: [],
    showRowNumbers: true,
    emptyMessage: "No data",
  };

  const { title, columns, showRowNumbers = true, emptyMessage = "No data" } = config;

  // Sort rows if sort state is set
  const sortedRows = React.useMemo(() => {
    if (!sortState || !config.sortable) return config.rows;

    return [...config.rows].sort((a, b) => {
      const aVal = a[sortState.columnKey];
      const bVal = b[sortState.columnKey];

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortState.direction === "asc" ? 1 : -1;
      if (bVal == null) return sortState.direction === "asc" ? -1 : 1;

      // Compare values
      let comparison = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortState.direction === "asc" ? comparison : -comparison;
    });
  }, [config.rows, config.sortable, sortState]);

  // Calculate layout
  const termWidth = dimensions.width;
  const termHeight = dimensions.height;
  const headerHeight = title ? 2 : 0;
  const tableHeaderHeight = 3; // Header row + separator
  const footerHeight = 2;
  const borderHeight = 2; // Top and bottom borders
  const viewportHeight = termHeight - headerHeight - tableHeaderHeight - footerHeight - borderHeight;
  const maxVisibleRows = Math.max(1, viewportHeight);

  // Compute column widths
  const computedColumns = React.useMemo(() => {
    return computeColumnWidths(columns, sortedRows, termWidth - 4, showRowNumbers);
  }, [columns, sortedRows, termWidth, showRowNumbers]);

  // Calculate total table width
  const rowNumWidth = showRowNumbers ? 5 : 0;
  const totalTableWidth = computedColumns.reduce(
    (sum, col) => sum + col.computedWidth + 3, // +3 for padding and separator
    rowNumWidth + 1 // +1 for left border
  );

  // Max horizontal scroll
  const maxHorizontalScroll = Math.max(0, totalTableWidth - termWidth + 4);

  // Update scroll to keep selected row visible
  useEffect(() => {
    if (selectedRowIndex < scrollOffset) {
      setScrollOffset(selectedRowIndex);
    } else if (selectedRowIndex >= scrollOffset + maxVisibleRows) {
      setScrollOffset(selectedRowIndex - maxVisibleRows + 1);
    }
  }, [selectedRowIndex, scrollOffset, maxVisibleRows]);

  // Handle row selection
  const handleSelect = useCallback(() => {
    if (sortedRows.length === 0) return;

    if (scenario === "multi-select") {
      // Toggle selection
      setSelectedRows((prev) => {
        const next = new Set(prev);
        if (next.has(selectedRowIndex)) {
          next.delete(selectedRowIndex);
        } else {
          next.add(selectedRowIndex);
        }
        return next;
      });
    } else if (scenario === "select") {
      // Single selection - send and close
      const result: TableSelectionResult = {
        selectedRows: [{
          index: selectedRowIndex,
          data: sortedRows[selectedRowIndex],
        }],
      };
      ipc.sendSelected(result);
      exit();
    }
  }, [scenario, sortedRows, selectedRowIndex, ipc, exit]);

  // Handle confirm in multi-select mode
  const handleConfirm = useCallback(() => {
    if (scenario !== "multi-select") return;

    const result: TableSelectionResult = {
      selectedRows: Array.from(selectedRows).map((index) => ({
        index,
        data: sortedRows[index],
      })),
    };
    ipc.sendSelected(result);
    exit();
  }, [scenario, selectedRows, sortedRows, ipc, exit]);

  // Keyboard controls
  useInput((input, key) => {
    // Filter out mouse sequences
    if (/^[<\[\];Mm\d]+$/.test(input)) return;

    // Quit with q or Escape
    if (input === "q" || key.escape) {
      ipc.sendCancelled("User quit");
      exit();
      return;
    }

    // Navigate up
    if (key.upArrow || input === "k") {
      setSelectedRowIndex((i) => Math.max(0, i - 1));
      return;
    }

    // Navigate down
    if (key.downArrow || input === "j") {
      setSelectedRowIndex((i) => Math.min(sortedRows.length - 1, i + 1));
      return;
    }

    // Scroll left
    if (key.leftArrow || input === "h") {
      setHorizontalScroll((s) => Math.max(0, s - 5));
      return;
    }

    // Scroll right
    if (key.rightArrow || input === "l") {
      setHorizontalScroll((s) => Math.min(maxHorizontalScroll, s + 5));
      return;
    }

    // Page up
    if (key.pageUp) {
      setSelectedRowIndex((i) => Math.max(0, i - maxVisibleRows));
      return;
    }

    // Page down
    if (key.pageDown) {
      setSelectedRowIndex((i) => Math.min(sortedRows.length - 1, i + maxVisibleRows));
      return;
    }

    // Home
    if (input === "g" && !key.shift) {
      setSelectedRowIndex(0);
      return;
    }

    // End
    if (input === "G") {
      setSelectedRowIndex(sortedRows.length - 1);
      return;
    }

    // Select with Enter
    if (key.return) {
      if (scenario === "multi-select") {
        handleConfirm();
      } else {
        handleSelect();
      }
      return;
    }

    // Toggle selection with Space (multi-select mode)
    if (input === " " && scenario === "multi-select") {
      handleSelect();
      return;
    }

    // Sort toggle with 's' (if sortable)
    if (input === "s" && config.sortable && computedColumns.length > 0) {
      // Cycle through columns or toggle direction
      if (!sortState) {
        setSortState({ columnKey: computedColumns[0].key, direction: "asc" });
      } else {
        const currentIndex = computedColumns.findIndex((c) => c.key === sortState.columnKey);
        if (sortState.direction === "asc") {
          setSortState({ ...sortState, direction: "desc" });
        } else {
          // Move to next column or clear
          const nextIndex = (currentIndex + 1) % computedColumns.length;
          if (nextIndex === 0) {
            setSortState(null);
          } else {
            setSortState({ columnKey: computedColumns[nextIndex].key, direction: "asc" });
          }
        }
      }
      return;
    }
  });

  // Render header row
  const renderHeader = () => {
    let header = BOX_CHARS.vertical;

    if (showRowNumbers) {
      header += padCell("#", 3, "right") + " " + BOX_CHARS.vertical;
    }

    for (const col of computedColumns) {
      const align = col.align || getDefaultAlign(col.type);
      let label = col.label;

      // Add sort indicator
      if (sortState?.columnKey === col.key) {
        label += sortState.direction === "asc" ? " ↑" : " ↓";
      }

      header += " " + padCell(label, col.computedWidth, align) + " " + BOX_CHARS.vertical;
    }

    return header;
  };

  // Render a data row
  const renderRow = (row: Record<string, unknown>, index: number, isSelected: boolean, isChecked: boolean) => {
    const bgColor = isSelected ? "blue" : undefined;
    const prefix = isChecked ? "✓ " : isSelected ? "> " : "  ";

    let rowStr = BOX_CHARS.vertical;

    if (showRowNumbers) {
      rowStr += padCell(String(index + 1), 3, "right") + " " + BOX_CHARS.vertical;
    }

    for (const col of computedColumns) {
      const value = formatCellValue(row[col.key], col.type);
      const align = col.align || getDefaultAlign(col.type);
      rowStr += " " + padCell(value, col.computedWidth, align) + " " + BOX_CHARS.vertical;
    }

    return (
      <Text key={`row-${index}`} backgroundColor={bgColor} color={isSelected ? "white" : undefined}>
        {prefix.slice(0, 2)}{rowStr.slice(2)}
      </Text>
    );
  };

  // Render separator line
  const renderSeparator = (type: "top" | "header" | "bottom") => {
    const chars = {
      top: { left: BOX_CHARS.topLeft, mid: BOX_CHARS.topT, right: BOX_CHARS.topRight },
      header: { left: BOX_CHARS.headerSep, mid: BOX_CHARS.columnSep, right: BOX_CHARS.headerSepRight },
      bottom: { left: BOX_CHARS.bottomLeft, mid: BOX_CHARS.bottomT, right: BOX_CHARS.bottomRight },
    }[type];

    let sep = chars.left;

    if (showRowNumbers) {
      sep += BOX_CHARS.horizontal.repeat(4) + chars.mid;
    }

    for (let i = 0; i < computedColumns.length; i++) {
      const col = computedColumns[i];
      sep += BOX_CHARS.horizontal.repeat(col.computedWidth + 2);
      sep += i < computedColumns.length - 1 ? chars.mid : chars.right;
    }

    return sep;
  };

  // Visible rows
  const visibleRows = sortedRows.slice(scrollOffset, scrollOffset + maxVisibleRows);

  // Build help text based on scenario
  const helpText = scenario === "multi-select"
    ? "↑↓ navigate · Space toggle · Enter confirm · q quit"
    : scenario === "select"
    ? "↑↓ navigate · Enter select · q quit"
    : "↑↓ navigate · ←→ scroll · q quit";

  const positionText = sortedRows.length > 0
    ? `${selectedRowIndex + 1}/${sortedRows.length}`
    : "0/0";

  return (
    <Box flexDirection="column" width={termWidth} height={termHeight}>
      {/* Title */}
      {title && (
        <Box marginBottom={1}>
          <Text bold color="cyan">
            {title} ({sortedRows.length} rows)
          </Text>
        </Box>
      )}

      {/* Table */}
      <Box flexDirection="column" flexGrow={1}>
        {sortedRows.length === 0 ? (
          <Box justifyContent="center" alignItems="center" flexGrow={1}>
            <Text color="gray">{emptyMessage}</Text>
          </Box>
        ) : (
          <>
            {/* Top border */}
            <Text color="gray">{renderSeparator("top")}</Text>

            {/* Header */}
            <Text bold color="cyan">{renderHeader()}</Text>

            {/* Header separator */}
            <Text color="gray">{renderSeparator("header")}</Text>

            {/* Data rows */}
            {visibleRows.map((row, idx) => {
              const actualIndex = scrollOffset + idx;
              const isSelected = actualIndex === selectedRowIndex;
              const isChecked = selectedRows.has(actualIndex);
              return renderRow(row, actualIndex, isSelected, isChecked);
            })}

            {/* Bottom border */}
            <Text color="gray">{renderSeparator("bottom")}</Text>
          </>
        )}
      </Box>

      {/* Status bar */}
      <Box marginTop={1} justifyContent="space-between">
        <Text color="gray" dimColor>
          {helpText}
        </Text>
        <Text color="gray" dimColor>
          {scenario === "multi-select" && selectedRows.size > 0
            ? `${selectedRows.size} selected · `
            : ""}
          {positionText}
          {sortState && ` · sorted by ${sortState.columnKey}`}
        </Text>
      </Box>
    </Box>
  );
}
