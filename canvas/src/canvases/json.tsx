// JSON Explorer Canvas - Collapsible tree view for JSON data

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Text, useInput, useApp, useStdout } from "ink";
import { useIPCServer } from "./calendar/hooks/use-ipc-server";
import type {
  JsonConfig,
  JsonSelectionResult,
  TreeNode,
} from "./json/types";
import {
  flattenJson,
  formatValue,
  buildPathString,
  JSON_STYLES,
  TREE_CHARS,
} from "./json/types";

interface Props {
  id: string;
  config?: JsonConfig;
  socketPath?: string;
  scenario?: string;
}

export function Json({ id, config: initialConfig, socketPath, scenario = "explore" }: Props) {
  const { exit } = useApp();
  const { stdout } = useStdout();

  // Terminal dimensions
  const [dimensions, setDimensions] = useState({
    width: stdout?.columns || 80,
    height: stdout?.rows || 24,
  });

  // Live config state
  const [liveConfig, setLiveConfig] = useState<JsonConfig | undefined>(initialConfig);

  // Navigation state
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Expanded paths (tracks which nodes are expanded)
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  // Initialize expanded paths based on expandDepth
  useEffect(() => {
    const config = liveConfig || { data: null };
    const depth = config.expandDepth ?? 2;
    // Initially expand all paths up to depth
    const initialExpanded = new Set<string>();

    // Always expand root
    initialExpanded.add("$");

    const traverse = (value: unknown, path: (string | number)[], currentDepth: number) => {
      if (currentDepth >= depth) return;
      const pathString = buildPathString(path);
      initialExpanded.add(pathString || "$");

      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          traverse(item, [...path, index], currentDepth + 1);
        });
      } else if (value && typeof value === "object") {
        Object.keys(value).forEach((key) => {
          traverse((value as Record<string, unknown>)[key], [...path, key], currentDepth + 1);
        });
      }
    };
    traverse(config.data, [], 0);
    setExpandedPaths(initialExpanded);
  }, [liveConfig]);

  // IPC for communicating with Claude
  const ipc = useIPCServer({
    socketPath,
    scenario: scenario || "explore",
    onClose: () => exit(),
    onUpdate: (newConfig) => {
      setLiveConfig(newConfig as JsonConfig);
      setSelectedIndex(0);
      setScrollOffset(0);
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
  const config = liveConfig || { data: null };
  const { title, data, showPath = true, showTypes = true } = config;

  // Flatten JSON into tree nodes
  const treeNodes = useMemo(() => {
    return flattenJson(data, expandedPaths);
  }, [data, expandedPaths]);

  // Calculate layout
  const termHeight = dimensions.height;
  const headerHeight = title ? 2 : 0;
  const pathHeight = showPath ? 1 : 0;
  const footerHeight = 2;
  const viewportHeight = termHeight - headerHeight - pathHeight - footerHeight - 1;
  const maxVisibleRows = Math.max(1, viewportHeight);

  // Keep selected row in view
  useEffect(() => {
    if (selectedIndex < scrollOffset) {
      setScrollOffset(selectedIndex);
    } else if (selectedIndex >= scrollOffset + maxVisibleRows) {
      setScrollOffset(selectedIndex - maxVisibleRows + 1);
    }
  }, [selectedIndex, scrollOffset, maxVisibleRows]);

  // Get currently selected node
  const selectedNode = treeNodes[selectedIndex];

  // Toggle expand/collapse
  const toggleExpand = useCallback((node: TreeNode) => {
    if (!node.hasChildren) return;

    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(node.pathString)) {
        next.delete(node.pathString);
      } else {
        next.add(node.pathString);
      }
      return next;
    });
  }, []);

  // Handle selection
  const handleSelect = useCallback(() => {
    if (!selectedNode) return;

    const result: JsonSelectionResult = {
      path: selectedNode.pathString,
      pathArray: selectedNode.path,
      value: selectedNode.value,
      type: selectedNode.type,
    };

    ipc.sendSelected(result);
    exit();
  }, [selectedNode, ipc, exit]);

  // Keyboard controls
  useInput((input, key) => {
    // Filter mouse sequences
    if (/^[<\[\];Mm\d]+$/.test(input)) return;

    // Quit
    if (input === "q" || key.escape) {
      ipc.sendCancelled("User quit");
      exit();
      return;
    }

    // Navigate up
    if (key.upArrow || input === "k") {
      setSelectedIndex((i) => Math.max(0, i - 1));
      return;
    }

    // Navigate down
    if (key.downArrow || input === "j") {
      setSelectedIndex((i) => Math.min(treeNodes.length - 1, i + 1));
      return;
    }

    // Page up
    if (key.pageUp) {
      setSelectedIndex((i) => Math.max(0, i - maxVisibleRows));
      return;
    }

    // Page down
    if (key.pageDown) {
      setSelectedIndex((i) => Math.min(treeNodes.length - 1, i + maxVisibleRows));
      return;
    }

    // Home
    if (input === "g") {
      setSelectedIndex(0);
      return;
    }

    // End
    if (input === "G") {
      setSelectedIndex(treeNodes.length - 1);
      return;
    }

    // Toggle expand/collapse with Space
    if (input === " " && selectedNode?.hasChildren) {
      toggleExpand(selectedNode);
      return;
    }

    // Enter always selects and returns the value
    if (key.return) {
      handleSelect();
      return;
    }

    // Expand with right arrow
    if ((key.rightArrow || input === "l") && selectedNode?.hasChildren && !selectedNode.isExpanded) {
      toggleExpand(selectedNode);
      return;
    }

    // Collapse with left arrow
    if ((key.leftArrow || input === "h") && selectedNode?.hasChildren && selectedNode.isExpanded) {
      toggleExpand(selectedNode);
      return;
    }

    // Expand all with 'e'
    if (input === "e") {
      const allPaths = new Set<string>();
      const traverse = (value: unknown, path: (string | number)[]) => {
        const pathString = buildPathString(path);
        if (pathString) allPaths.add(pathString);
        if (Array.isArray(value)) {
          value.forEach((item, index) => traverse(item, [...path, index]));
        } else if (value && typeof value === "object") {
          Object.keys(value).forEach((key) =>
            traverse((value as Record<string, unknown>)[key], [...path, key])
          );
        }
      };
      traverse(data, []);
      setExpandedPaths(allPaths);
      return;
    }

    // Collapse all with 'c'
    if (input === "c") {
      setExpandedPaths(new Set());
      return;
    }
  });

  // Render a tree node
  const renderNode = (node: TreeNode, index: number) => {
    const isSelected = index === selectedIndex;
    const bgColor = isSelected ? "blue" : undefined;

    // Build tree prefix
    let prefix = "";
    for (let i = 0; i < node.depth; i++) {
      prefix += "  ";
    }

    // Expand/collapse icon
    let icon = "  ";
    if (node.hasChildren) {
      icon = node.isExpanded ? TREE_CHARS.expanded + " " : TREE_CHARS.collapsed + " ";
    }

    // Key display
    const keyStr = typeof node.key === "number" ? `[${node.key}]` : node.key === "$" ? "" : `${node.key}:`;

    // Value display
    let valueDisplay = "";
    if (node.hasChildren) {
      const bracket = node.type === "array" ? "[]" : "{}";
      valueDisplay = node.isExpanded
        ? (node.type === "array" ? "[" : "{")
        : `${bracket} (${node.childCount})`;
    } else {
      valueDisplay = formatValue(node.value, node.type);
    }

    // Type hint
    const typeHint = showTypes && !node.hasChildren ? ` <${node.type}>` : "";

    return (
      <Text key={node.id} backgroundColor={bgColor} color={isSelected ? "white" : undefined}>
        {prefix}
        <Text color="blue">{icon}</Text>
        {keyStr && <Text color="cyan">{keyStr} </Text>}
        <Text color={getValueColor(node)}>{valueDisplay}</Text>
        {typeHint && <Text color="gray" dimColor>{typeHint}</Text>}
      </Text>
    );
  };

  // Get color for value based on type
  const getValueColor = (node: TreeNode): string | undefined => {
    if (node.hasChildren) return "white";
    switch (node.type) {
      case "string": return "green";
      case "number": return "yellow";
      case "boolean": return "magenta";
      case "null": return "gray";
      default: return undefined;
    }
  };

  // Visible nodes
  const visibleNodes = treeNodes.slice(scrollOffset, scrollOffset + maxVisibleRows);

  // Help text
  const helpText = "↑↓ navigate · Enter select · Space toggle · ←→ expand · q quit";

  const positionText = treeNodes.length > 0
    ? `${selectedIndex + 1}/${treeNodes.length}`
    : "empty";

  return (
    <Box flexDirection="column" width={dimensions.width} height={termHeight}>
      {/* Title */}
      {title && (
        <Box marginBottom={1}>
          <Text bold color="cyan">{title}</Text>
        </Box>
      )}

      {/* Current path */}
      {showPath && selectedNode && (
        <Box>
          <Text color="gray" dimColor>
            Path: <Text color="yellow">{selectedNode.pathString || "$"}</Text>
          </Text>
        </Box>
      )}

      {/* Tree view */}
      <Box flexDirection="column" flexGrow={1}>
        {treeNodes.length === 0 ? (
          <Box justifyContent="center" alignItems="center" flexGrow={1}>
            <Text color="gray">No data</Text>
          </Box>
        ) : (
          visibleNodes.map((node, idx) => renderNode(node, scrollOffset + idx))
        )}
      </Box>

      {/* Status bar */}
      <Box marginTop={1} justifyContent="space-between">
        <Text color="gray" dimColor>{helpText}</Text>
        <Text color="gray" dimColor>{positionText}</Text>
      </Box>
    </Box>
  );
}
