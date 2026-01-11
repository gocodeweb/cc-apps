// Kanban Canvas - Task board with columns and cards

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Text, useInput, useApp, useStdout } from "ink";
import { useIPCServer } from "./calendar/hooks/use-ipc-server";
import { MarkdownRenderer } from "./document/components/markdown-renderer";
import type {
  KanbanConfig,
  KanbanColumn,
  KanbanCard,
  KanbanPosition,
  KanbanResult,
  KanbanMoveResult,
} from "./kanban/types";
import {
  truncateText,
  getColumnWipStatus,
  getLabelColor,
  computeColumnWidth,
  cloneColumns,
  PRIORITY_ICONS,
  LABEL_MARKER,
} from "./kanban/types";

interface Props {
  id: string;
  config?: KanbanConfig;
  socketPath?: string;
  scenario?: string;
}

export function Kanban({
  id,
  config: initialConfig,
  socketPath,
  scenario = "display",
}: Props) {
  const { exit } = useApp();
  const { stdout } = useStdout();

  // Terminal dimensions
  const [dimensions, setDimensions] = useState({
    width: stdout?.columns || 80,
    height: stdout?.rows || 24,
  });

  // Live config state (can be updated via IPC)
  const [liveConfig, setLiveConfig] = useState<KanbanConfig | undefined>(
    initialConfig
  );

  // For manage scenario: track local changes to columns
  const [localColumns, setLocalColumns] = useState<KanbanColumn[] | null>(null);

  // Move history for undo
  const [moveHistory, setMoveHistory] = useState<KanbanMoveResult[]>([]);

  // Navigation state
  const [position, setPosition] = useState<KanbanPosition>({
    columnIndex: 0,
    cardIndex: 0,
  });

  // Per-column scroll offsets
  const [columnScrollOffsets, setColumnScrollOffsets] = useState<number[]>([]);

  // Preview mode state
  const [showingPreview, setShowingPreview] = useState(false);
  const [previewScrollOffset, setPreviewScrollOffset] = useState(0);

  // IPC communication
  const ipc = useIPCServer({
    socketPath,
    scenario: scenario || "display",
    onClose: () => exit(),
    onUpdate: (newConfig) => {
      setLiveConfig(newConfig as KanbanConfig);
      setPosition({ columnIndex: 0, cardIndex: 0 });
      setLocalColumns(null);
      setMoveHistory([]);
    },
  });

  // Terminal resize handling
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
  const config = liveConfig || { columns: [] };

  // Use local columns for manage mode, otherwise use config
  const columns = localColumns || config.columns;

  // Calculate max visible cards per column based on terminal height
  const cardHeight = 6; // Height per card (border + 2 lines of text + padding)
  const titleHeight = config.title ? 2 : 0;
  const columnHeaderHeight = 3;
  const statusBarHeight = 2;
  const scrollIndicatorHeight = 2; // Space for ▲/▼ indicators
  const availableHeight = dimensions.height - titleHeight - statusBarHeight - scrollIndicatorHeight;
  const maxVisibleCards = Math.max(2, Math.floor((availableHeight - columnHeaderHeight) / cardHeight));

  // Initialize local columns when entering manage mode
  useEffect(() => {
    if (scenario === "manage" && !localColumns && config.columns.length > 0) {
      setLocalColumns(cloneColumns(config.columns));
    }
  }, [scenario, localColumns, config.columns]);

  // Calculate layout
  const columnWidth = computeColumnWidth(
    columns.length || 1,
    dimensions.width,
    config.columnWidth
  );

  // Keep position valid and initialize scroll offsets
  useEffect(() => {
    if (columns.length === 0) return;

    // Initialize scroll offsets if needed
    if (columnScrollOffsets.length !== columns.length) {
      setColumnScrollOffsets(columns.map(() => 0));
    }

    setPosition((pos) => {
      const newColIndex = Math.min(pos.columnIndex, columns.length - 1);
      const column = columns[newColIndex];
      const maxCard = column ? Math.max(0, column.cards.length - 1) : 0;
      const newCardIndex = Math.min(Math.max(0, pos.cardIndex), maxCard);

      return { columnIndex: newColIndex, cardIndex: newCardIndex };
    });
  }, [columns, columnScrollOffsets.length]);

  // Auto-scroll to keep selected card visible
  useEffect(() => {
    const colIndex = position.columnIndex;
    const cardIndex = position.cardIndex;
    const currentOffset = columnScrollOffsets[colIndex] || 0;

    let newOffset = currentOffset;

    // Scroll down if card is below visible area
    if (cardIndex >= currentOffset + maxVisibleCards) {
      newOffset = cardIndex - maxVisibleCards + 1;
    }
    // Scroll up if card is above visible area
    if (cardIndex < currentOffset) {
      newOffset = cardIndex;
    }

    if (newOffset !== currentOffset) {
      setColumnScrollOffsets((offsets) => {
        const newOffsets = [...offsets];
        newOffsets[colIndex] = newOffset;
        return newOffsets;
      });
    }
  }, [position.columnIndex, position.cardIndex, columnScrollOffsets, maxVisibleCards]);

  // Current selection
  const currentColumn = columns[position.columnIndex];
  const currentCard = currentColumn?.cards[position.cardIndex];

  // Move card to a different column
  const moveCardToColumn = useCallback(
    (targetColumnIndex: number) => {
      if (!currentCard || !localColumns) return;
      if (targetColumnIndex < 0 || targetColumnIndex >= localColumns.length)
        return;
      if (targetColumnIndex === position.columnIndex) return;

      const sourceCol = localColumns[position.columnIndex];
      const targetCol = localColumns[targetColumnIndex];
      if (!sourceCol || !targetCol) return;

      // Record move for undo
      const move: KanbanMoveResult = {
        card: currentCard,
        fromColumn: sourceCol.id,
        toColumn: targetCol.id,
        fromIndex: position.cardIndex,
        toIndex: targetCol.cards.length,
      };
      setMoveHistory((h) => [...h, move]);

      // Update columns
      setLocalColumns((cols) => {
        if (!cols) return cols;
        const newCols = cols.map((col) => ({
          ...col,
          cards: [...col.cards],
        }));

        // Remove from source
        newCols[position.columnIndex]!.cards.splice(position.cardIndex, 1);

        // Add to target
        newCols[targetColumnIndex]!.cards.push(currentCard);

        return newCols;
      });

      // Update position
      setPosition({
        columnIndex: targetColumnIndex,
        cardIndex: targetCol.cards.length, // Will be at end
      });
    },
    [currentCard, localColumns, position]
  );

  // Undo last move
  const undoLastMove = useCallback(() => {
    if (moveHistory.length === 0 || !localColumns) return;

    const lastMove = moveHistory[moveHistory.length - 1]!;
    setMoveHistory((h) => h.slice(0, -1));

    // Find column indices
    const fromIdx = localColumns.findIndex((c) => c.id === lastMove.toColumn);
    const toIdx = localColumns.findIndex((c) => c.id === lastMove.fromColumn);

    if (fromIdx === -1 || toIdx === -1) return;

    setLocalColumns((cols) => {
      if (!cols) return cols;
      const newCols = cols.map((col) => ({
        ...col,
        cards: [...col.cards],
      }));

      // Find and remove card from current location
      const cardIdx = newCols[fromIdx]!.cards.findIndex(
        (c) => c.id === lastMove.card.id
      );
      if (cardIdx !== -1) {
        newCols[fromIdx]!.cards.splice(cardIdx, 1);
      }

      // Add back to original column at original position
      newCols[toIdx]!.cards.splice(
        Math.min(lastMove.fromIndex, newCols[toIdx]!.cards.length),
        0,
        lastMove.card
      );

      return newCols;
    });

    setPosition({ columnIndex: toIdx, cardIndex: lastMove.fromIndex });
  }, [moveHistory, localColumns]);

  // Handle selection (select scenario)
  const handleSelect = useCallback(() => {
    if (!currentCard || !currentColumn) return;

    const result: KanbanResult = {
      type: "card-selected",
      selection: {
        card: currentCard,
        columnId: currentColumn.id,
        columnTitle: currentColumn.title,
        cardIndex: position.cardIndex,
      },
    };

    ipc.sendSelected(result);
    exit();
  }, [currentCard, currentColumn, position, ipc, exit]);

  // Handle confirm (manage scenario)
  const handleConfirm = useCallback(() => {
    if (scenario !== "manage" || !localColumns) return;

    const result: KanbanResult = {
      type: "cards-moved",
      moves: moveHistory,
      updatedColumns: localColumns,
    };

    ipc.sendSelected(result);
    exit();
  }, [scenario, localColumns, moveHistory, ipc, exit]);

  // Keyboard input handling
  useInput((input, key) => {
    // Filter mouse sequences
    if (/^[<\[\];Mm\d]+$/.test(input)) return;

    // Preview mode handling
    if (showingPreview) {
      // Close preview
      if (key.escape || input === " " || input === "q") {
        setShowingPreview(false);
        setPreviewScrollOffset(0);
        return;
      }
      // Scroll up
      if (key.upArrow || input === "k") {
        setPreviewScrollOffset((o) => Math.max(0, o - 1));
        return;
      }
      // Scroll down
      if (key.downArrow || input === "j") {
        setPreviewScrollOffset((o) => o + 1);
        return;
      }
      // Page up
      if (input === "u" || key.pageUp) {
        setPreviewScrollOffset((o) => Math.max(0, o - 10));
        return;
      }
      // Page down
      if (input === "d" || key.pageDown) {
        setPreviewScrollOffset((o) => o + 10);
        return;
      }
      // Go to top
      if (input === "g") {
        setPreviewScrollOffset(0);
        return;
      }
      // Go to bottom
      if (input === "G") {
        setPreviewScrollOffset(9999);
        return;
      }
      return;
    }

    // Quit
    if (input === "q" || key.escape) {
      ipc.sendCancelled("User quit");
      exit();
      return;
    }

    // Column navigation: left
    if (key.leftArrow || input === "h") {
      setPosition((p) => ({
        columnIndex: Math.max(0, p.columnIndex - 1),
        cardIndex: Math.min(
          p.cardIndex,
          Math.max(0, (columns[Math.max(0, p.columnIndex - 1)]?.cards.length || 1) - 1)
        ),
      }));
      return;
    }

    // Column navigation: right
    if (key.rightArrow || input === "l") {
      setPosition((p) => ({
        columnIndex: Math.min(columns.length - 1, p.columnIndex + 1),
        cardIndex: Math.min(
          p.cardIndex,
          Math.max(
            0,
            (columns[Math.min(columns.length - 1, p.columnIndex + 1)]?.cards.length || 1) - 1
          )
        ),
      }));
      return;
    }

    // Card navigation: up
    if (key.upArrow || input === "k") {
      setPosition((p) => ({
        ...p,
        cardIndex: Math.max(0, p.cardIndex - 1),
      }));
      return;
    }

    // Card navigation: down
    if (key.downArrow || input === "j") {
      const maxIndex = (currentColumn?.cards.length || 1) - 1;
      setPosition((p) => ({
        ...p,
        cardIndex: Math.min(maxIndex, p.cardIndex + 1),
      }));
      return;
    }

    // Jump to first card
    if (input === "g" && !key.shift) {
      setPosition((p) => ({ ...p, cardIndex: 0 }));
      return;
    }

    // Jump to last card
    if (input === "G") {
      const maxIndex = (currentColumn?.cards.length || 1) - 1;
      setPosition((p) => ({ ...p, cardIndex: maxIndex }));
      return;
    }

    // Jump to first column
    if (input === "0") {
      setPosition((p) => ({
        columnIndex: 0,
        cardIndex: Math.min(p.cardIndex, Math.max(0, (columns[0]?.cards.length || 1) - 1)),
      }));
      return;
    }

    // Jump to last column
    if (input === "$") {
      const lastIdx = columns.length - 1;
      setPosition((p) => ({
        columnIndex: lastIdx,
        cardIndex: Math.min(
          p.cardIndex,
          Math.max(0, (columns[lastIdx]?.cards.length || 1) - 1)
        ),
      }));
      return;
    }

    // Preview card details (show overlay with full body)
    if (input === " " && scenario === "select" && currentCard) {
      setShowingPreview(true);
      setPreviewScrollOffset(0);
      return;
    }

    // Select (select scenario)
    if (key.return && scenario === "select") {
      handleSelect();
      return;
    }

    // Confirm (manage scenario)
    if (key.return && scenario === "manage") {
      handleConfirm();
      return;
    }

    // Move card left (manage scenario)
    if (input === "H" && scenario === "manage") {
      moveCardToColumn(position.columnIndex - 1);
      return;
    }

    // Move card right (manage scenario)
    if (input === "L" && scenario === "manage") {
      moveCardToColumn(position.columnIndex + 1);
      return;
    }

    // Move to column by number (1-9)
    if (scenario === "manage" && /^[1-9]$/.test(input)) {
      const targetIdx = parseInt(input, 10) - 1;
      if (targetIdx < columns.length) {
        moveCardToColumn(targetIdx);
      }
      return;
    }

    // Undo
    if (input === "u" && scenario === "manage") {
      undoLastMove();
      return;
    }
  });

  // Render a single card
  const renderCard = (
    card: KanbanCard,
    cardIndex: number,
    colIndex: number,
    cardWidth: number
  ) => {
    const isSelected =
      colIndex === position.columnIndex && cardIndex === position.cardIndex;
    // Account for border (2) + padding (2) + priority icon (2)
    const maxTitleLen = Math.max(10, cardWidth - 8);

    // Priority icon
    const priorityIcon = card.priority ? PRIORITY_ICONS[card.priority] + " " : "";

    // Labels
    const labelMarkers =
      config.showLabels !== false && card.labels?.length
        ? card.labels.slice(0, 3).map((labelId, i) => (
            <Text key={i} color={getLabelColor(labelId, config.labels)}>
              {LABEL_MARKER}
            </Text>
          ))
        : null;

    // Calculate how many chars fit in 2 lines
    const charsPerLine = Math.max(10, cardWidth - 10);
    const maxChars = charsPerLine * 2;

    return (
      <Box
        key={card.id}
        flexDirection="column"
        borderStyle="single"
        borderColor={isSelected ? "blue" : "gray"}
        width={cardWidth - 2}
        paddingX={1}
        minHeight={4}
      >
        {/* Title with priority */}
        <Box flexDirection="row" width={charsPerLine}>
          {card.priority && (
            <Text
              color={
                card.priority === "urgent" || card.priority === "high"
                  ? "red"
                  : card.priority === "medium"
                  ? "yellow"
                  : "gray"
              }
            >
              {priorityIcon}
            </Text>
          )}
          <Text bold inverse={isSelected} wrap="wrap">
            {truncateText(card.title, maxChars)}
          </Text>
        </Box>

        {/* Labels row */}
        {labelMarkers && labelMarkers.length > 0 && <Box gap={1}>{labelMarkers}</Box>}
      </Box>
    );
  };

  // Render a single column
  const renderColumn = (column: KanbanColumn, colIndex: number) => {
    const isSelected = colIndex === position.columnIndex;
    const wipStatus = getColumnWipStatus(column);
    const cardCount = column.cards.length;
    const scrollOffset = columnScrollOffsets[colIndex] || 0;

    // Column header color based on WIP status
    let headerColor: string = column.color || "cyan";
    if (wipStatus === "exceeded") headerColor = "red";
    else if (wipStatus === "warning") headerColor = "yellow";

    // WIP display
    const wipDisplay = column.wipLimit
      ? ` [${cardCount}/${column.wipLimit}]`
      : config.showCardCount !== false
      ? ` (${cardCount})`
      : "";

    // Card width for this column
    const cardWidth = columnWidth - 2; // Account for column border

    // Calculate visible cards
    const visibleCards = column.cards.slice(scrollOffset, scrollOffset + maxVisibleCards);
    const hasMoreAbove = scrollOffset > 0;
    const hasMoreBelow = scrollOffset + maxVisibleCards < column.cards.length;

    return (
      <Box
        key={column.id}
        flexDirection="column"
        width={columnWidth}
        borderStyle={isSelected ? "double" : "single"}
        borderColor={isSelected ? "blue" : "gray"}
        minHeight={10}
      >
        {/* Column header */}
        <Box paddingX={1}>
          <Text bold color={headerColor as any}>
            {truncateText(column.title, columnWidth - 10)}
          </Text>
          <Text color={wipStatus === "normal" ? "gray" : (headerColor as any)}>
            {wipDisplay}
          </Text>
        </Box>

        {/* Scroll up indicator */}
        {hasMoreAbove && (
          <Box justifyContent="center">
            <Text color="gray">▲ {scrollOffset} more</Text>
          </Box>
        )}

        {/* Cards */}
        <Box flexDirection="column" paddingX={1} flexGrow={1}>
          {column.cards.length === 0 ? (
            <Text color="gray" dimColor>
              (empty)
            </Text>
          ) : (
            visibleCards.map((card, idx) =>
              renderCard(card, scrollOffset + idx, colIndex, cardWidth)
            )
          )}
        </Box>

        {/* Scroll down indicator */}
        {hasMoreBelow && (
          <Box justifyContent="center">
            <Text color="gray">▼ {column.cards.length - scrollOffset - maxVisibleCards} more</Text>
          </Box>
        )}
      </Box>
    );
  };

  // Render preview overlay with scrollable markdown content
  const renderPreview = () => {
    if (!currentCard) return null;

    const content = currentCard.body || currentCard.description || currentCard.title;

    // Calculate visible area
    const headerHeight = 3;
    const footerHeight = 2;
    const viewportHeight = dimensions.height - headerHeight - footerHeight;
    const contentWidth = dimensions.width - 4; // Account for padding

    // Estimate total lines (rough, markdown may expand)
    const estimatedLines = content.split("\n").length + 10;
    const maxOffset = Math.max(0, estimatedLines - viewportHeight);
    const clampedOffset = Math.min(previewScrollOffset, maxOffset);

    const scrollInfo = `Line ${clampedOffset + 1}+`;

    return (
      <Box
        flexDirection="column"
        width={dimensions.width}
        height={dimensions.height}
      >
        {/* Header */}
        <Box
          borderStyle="single"
          borderColor="cyan"
          paddingX={1}
          marginX={1}
        >
          <Text bold color="cyan">
            {truncateText(currentCard.title, dimensions.width - 6)}
          </Text>
        </Box>

        {/* Markdown Content */}
        <Box
          flexDirection="column"
          flexGrow={1}
          paddingX={2}
          overflow="hidden"
        >
          <MarkdownRenderer
            content={content}
            terminalWidth={contentWidth}
            scrollOffset={clampedOffset}
            viewportHeight={viewportHeight}
          />
        </Box>

        {/* Footer */}
        <Box paddingX={1} justifyContent="space-between">
          <Text color="gray" dimColor>
            ↑↓/jk scroll · u/d page · g/G top/bottom · Space/q close
          </Text>
          <Text color="gray" dimColor>
            {scrollInfo}
          </Text>
        </Box>
      </Box>
    );
  };

  // Help text based on scenario
  const helpText =
    scenario === "manage"
      ? "←→ columns · ↑↓ cards · H/L move · 1-9 jump · u undo · Enter confirm"
      : scenario === "select"
      ? "←→ columns · ↑↓ cards · Space=preview · Enter=select · q=quit"
      : "←→ columns · ↑↓ cards · q quit";

  const positionText = currentColumn
    ? `${position.columnIndex + 1}/${columns.length} : ${position.cardIndex + 1}/${currentColumn.cards.length}`
    : "0/0";

  // Show preview overlay
  if (showingPreview) {
    return renderPreview();
  }

  // Empty state
  if (columns.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="gray">No columns to display</Text>
      </Box>
    );
  }

  return (
    <Box
      flexDirection="column"
      width={dimensions.width}
      height={dimensions.height}
    >
      {/* Title */}
      {config.title && (
        <Box marginBottom={1} paddingX={1}>
          <Text bold color="cyan">
            {config.title}
          </Text>
        </Box>
      )}

      {/* Columns */}
      <Box flexDirection="row" flexGrow={1} gap={1} paddingX={1}>
        {columns.map((col, idx) => renderColumn(col, idx))}
      </Box>

      {/* Status bar */}
      <Box marginTop={1} paddingX={1} justifyContent="space-between">
        <Text color="gray" dimColor>
          {helpText}
        </Text>
        <Text color="gray" dimColor>
          {scenario === "manage" && moveHistory.length > 0
            ? `${moveHistory.length} moves · `
            : ""}
          {positionText}
        </Text>
      </Box>
    </Box>
  );
}

export type { KanbanConfig };
