// JSON Explorer Canvas Types

// JSON explorer configuration
export interface JsonConfig {
  title?: string;
  data: unknown;                    // The JSON data to explore
  expandDepth?: number;             // Initial expand depth (default: 2)
  showPath?: boolean;               // Show current path in header (default: true)
  showTypes?: boolean;              // Show type hints (default: true)
}

// Selection result (path to selected value)
export interface JsonSelectionResult {
  path: string;                     // JSONPath-like string, e.g., "users[0].name"
  pathArray: (string | number)[];   // Path as array, e.g., ["users", 0, "name"]
  value: unknown;                   // The selected value
  type: JsonNodeType;               // Type of the value
}

// Node types for rendering
export type JsonNodeType =
  | "object"
  | "array"
  | "string"
  | "number"
  | "boolean"
  | "null";

// Internal: Flattened tree node for rendering
export interface TreeNode {
  id: string;                       // Unique identifier
  key: string | number;             // Object key or array index
  value: unknown;                   // The value at this node
  type: JsonNodeType;               // Type of value
  depth: number;                    // Nesting level
  path: (string | number)[];        // Full path to this node
  pathString: string;               // Path as string
  hasChildren: boolean;             // Whether node can be expanded
  childCount?: number;              // Number of children (for objects/arrays)
  isExpanded: boolean;              // Current expand state
  isLastChild: boolean;             // For tree drawing
  parentPath: string;               // Parent's path string
}

// Style constants
export const JSON_STYLES = {
  key: { color: "cyan" },
  string: { color: "green" },
  number: { color: "yellow" },
  boolean: { color: "magenta" },
  null: { color: "gray", dimColor: true },
  bracket: { color: "white" },
  expandIcon: { color: "blue" },
  selectedRow: { backgroundColor: "blue" },
  path: { color: "gray", dimColor: true },
  type: { color: "gray", dimColor: true },
  count: { color: "gray", dimColor: true },
} as const;

// Tree drawing characters
export const TREE_CHARS = {
  vertical: "│",
  branch: "├",
  lastBranch: "└",
  horizontal: "─",
  expanded: "▼",
  collapsed: "▶",
  leaf: " ",
} as const;

// Get the type of a JSON value
export function getJsonType(value: unknown): JsonNodeType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  switch (typeof value) {
    case "object": return "object";
    case "string": return "string";
    case "number": return "number";
    case "boolean": return "boolean";
    default: return "null";
  }
}

// Format a value for display
export function formatValue(value: unknown, type: JsonNodeType): string {
  switch (type) {
    case "string":
      const str = value as string;
      // Truncate long strings
      if (str.length > 50) {
        return `"${str.slice(0, 47)}..."`;
      }
      return `"${str}"`;
    case "number":
      return String(value);
    case "boolean":
      return value ? "true" : "false";
    case "null":
      return "null";
    case "object":
      return "{}";
    case "array":
      return "[]";
    default:
      return String(value);
  }
}

// Build path string from path array
export function buildPathString(path: (string | number)[]): string {
  if (path.length === 0) return "$";

  return path.reduce((acc: string, key, index) => {
    if (typeof key === "number") {
      return `${acc}[${key}]`;
    }
    // Use dot notation for valid identifiers, bracket notation otherwise
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
      return index === 0 ? key : `${acc}.${key}`;
    }
    return `${acc}["${key}"]`;
  }, "");
}

// Flatten JSON into tree nodes
export function flattenJson(
  data: unknown,
  expandedPaths: Set<string>,
  maxDepth: number = Infinity
): TreeNode[] {
  const nodes: TreeNode[] = [];

  function traverse(
    value: unknown,
    key: string | number,
    depth: number,
    path: (string | number)[],
    isLastChild: boolean,
    parentPath: string
  ) {
    const type = getJsonType(value);
    const pathString = buildPathString(path);
    const hasChildren = type === "object" || type === "array";
    const childCount = hasChildren
      ? (type === "array" ? (value as unknown[]).length : Object.keys(value as object).length)
      : undefined;

    // Determine if expanded (only check expandedPaths - initial depth is handled by caller)
    const isExpanded = expandedPaths.has(pathString);

    const node: TreeNode = {
      id: pathString || "$root",
      key,
      value,
      type,
      depth,
      path,
      pathString,
      hasChildren,
      childCount,
      isExpanded: hasChildren ? isExpanded : false,
      isLastChild,
      parentPath,
    };

    nodes.push(node);

    // Recurse into children if expanded
    if (hasChildren && isExpanded) {
      if (type === "array") {
        const arr = value as unknown[];
        arr.forEach((item, index) => {
          traverse(item, index, depth + 1, [...path, index], index === arr.length - 1, pathString);
        });
      } else {
        const obj = value as Record<string, unknown>;
        const keys = Object.keys(obj);
        keys.forEach((k, index) => {
          traverse(obj[k], k, depth + 1, [...path, k], index === keys.length - 1, pathString);
        });
      }
    }
  }

  const rootType = getJsonType(data);
  if (rootType === "object" || rootType === "array") {
    // Start with root
    traverse(data, "$", 0, [], true, "");
  } else {
    // Primitive at root
    nodes.push({
      id: "$root",
      key: "$",
      value: data,
      type: rootType,
      depth: 0,
      path: [],
      pathString: "$",
      hasChildren: false,
      isExpanded: false,
      isLastChild: true,
      parentPath: "",
    });
  }

  return nodes;
}
