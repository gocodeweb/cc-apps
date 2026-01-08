// Chart Canvas Types

// ============================================
// Chart Type Definitions
// ============================================

export type ChartType = "bar" | "bar-horizontal" | "line" | "line-smooth" | "pie";

// ============================================
// Data Point Definitions
// ============================================

export interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface DataSeries {
  name: string;
  data: DataPoint[];
  color?: string;
}

// ============================================
// Chart Configuration
// ============================================

export interface ChartConfig {
  title?: string;
  type: ChartType;
  series: DataSeries[];

  // Display options
  showLegend?: boolean;
  showValues?: boolean;
  showGrid?: boolean;

  // Axis options (for bar/line charts)
  xAxisLabel?: string;
  yAxisLabel?: string;
  yMin?: number;
  yMax?: number;

  // Line chart specific
  height?: number;

  // Color palette
  colors?: string[];
}

// ============================================
// Selection Results
// ============================================

export interface ChartDataPointSelection {
  seriesIndex: number;
  seriesName: string;
  pointIndex: number;
  label: string;
  value: number;
}

export interface ChartSelectionResult {
  selectedPoints: ChartDataPointSelection[];
}

// ============================================
// Internal Types
// ============================================

export interface SelectableElement {
  seriesIndex: number;
  pointIndex: number;
  label: string;
  value: number;
}

// ============================================
// Style Constants
// ============================================

// Default color palette for series
export const DEFAULT_COLORS = [
  "green",
  "blue",
  "yellow",
  "magenta",
  "cyan",
  "red",
  "white",
] as const;

// Bar chart characters (Unicode block elements)
export const BAR_CHARS = {
  full: "\u2588",
  sevenEighths: "\u2589",
  threeQuarters: "\u258A",
  fiveEighths: "\u258B",
  half: "\u258C",
  threeEighths: "\u258D",
  quarter: "\u258E",
  eighth: "\u258F",
  // Vertical bar components for vertical charts
  top: "\u2580",
  bottom: "\u2584",
} as const;

// Pie chart characters
export const PIE_CHARS = {
  filled: "\u2588",
  shaded: "\u2593",
  light: "\u2591",
} as const;

// ============================================
// Utility Functions
// ============================================

export function getSeriesColor(index: number, colors?: string[]): string {
  const palette = colors && colors.length > 0 ? colors : [...DEFAULT_COLORS];
  return palette[index % palette.length] || "white";
}

export function formatValue(value: number, precision: number = 1): string {
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(precision) + "M";
  }
  if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(precision) + "K";
  }
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(precision);
}

export function calculateBarWidth(
  value: number,
  maxValue: number,
  availableWidth: number
): number {
  if (maxValue === 0) return 0;
  return Math.round((value / maxValue) * availableWidth);
}

export function renderBar(width: number): string {
  const fullBlocks = Math.floor(width);
  const remainder = width - fullBlocks;

  let bar = BAR_CHARS.full.repeat(fullBlocks);

  // Add partial block for fractional width
  if (remainder >= 0.875) bar += BAR_CHARS.sevenEighths;
  else if (remainder >= 0.75) bar += BAR_CHARS.threeQuarters;
  else if (remainder >= 0.625) bar += BAR_CHARS.fiveEighths;
  else if (remainder >= 0.5) bar += BAR_CHARS.half;
  else if (remainder >= 0.375) bar += BAR_CHARS.threeEighths;
  else if (remainder >= 0.25) bar += BAR_CHARS.quarter;
  else if (remainder >= 0.125) bar += BAR_CHARS.eighth;

  return bar;
}

// Calculate pie slice percentages
export interface PieSlice {
  point: DataPoint;
  percentage: number;
}

export function calculatePieSlices(data: DataPoint[]): PieSlice[] {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return [];

  return data.map((point) => ({
    point,
    percentage: (point.value / total) * 100,
  }));
}

// Compute all selectable elements from config
export function computeSelectableElements(
  config: ChartConfig | undefined
): SelectableElement[] {
  if (!config) return [];

  const elements: SelectableElement[] = [];

  for (let si = 0; si < config.series.length; si++) {
    const series = config.series[si];
    if (!series) continue;
    for (let pi = 0; pi < series.data.length; pi++) {
      const point = series.data[pi];
      if (!point) continue;
      elements.push({
        seriesIndex: si,
        pointIndex: pi,
        label: point.label,
        value: point.value,
      });
    }
  }

  return elements;
}

// Get max value across all series
export function getMaxValue(config: ChartConfig): number {
  let max = config.yMax ?? 0;
  for (const series of config.series) {
    for (const point of series.data) {
      if (point.value > max) max = point.value;
    }
  }
  return max;
}

// Get min value across all series
export function getMinValue(config: ChartConfig): number {
  let min = config.yMin ?? Infinity;
  for (const series of config.series) {
    for (const point of series.data) {
      if (point.value < min) min = point.value;
    }
  }
  return min === Infinity ? 0 : min;
}

// Braille character rendering for smooth line charts
// Braille has 2x4 dots per character: dots 1-3 left column, 4-6 right column, 7-8 bottom
const BRAILLE_BASE = 0x2800;
const BRAILLE_DOTS = [
  [0x01, 0x08], // row 0: dots 1, 4
  [0x02, 0x10], // row 1: dots 2, 5
  [0x04, 0x20], // row 2: dots 3, 6
  [0x40, 0x80], // row 3: dots 7, 8
];

export interface BrailleRenderResult {
  lines: string[];      // The main line
  gridLines: string[];  // Grid lines (same dimensions, separate layer)
}

export function renderBrailleLine(
  values: number[],
  width: number,
  height: number,
  minVal?: number,
  maxVal?: number,
  showGrid?: boolean,
  gridLines?: number // number of horizontal grid lines
): BrailleRenderResult {
  const min = minVal ?? Math.min(...values);
  const max = maxVal ?? Math.max(...values);
  const range = max - min || 1;

  // Each character is 2 columns x 4 rows of dots
  const charWidth = Math.ceil(width / 2);
  const charHeight = Math.ceil(height / 4);
  const dotsHeight = charHeight * 4;

  // Initialize separate grids for line and grid
  const lineGrid: number[][] = [];
  const gridGrid: number[][] = [];
  for (let y = 0; y < charHeight; y++) {
    lineGrid.push(new Array(charWidth).fill(0));
    gridGrid.push(new Array(charWidth).fill(0));
  }

  // Draw horizontal grid lines if enabled (into separate grid)
  if (showGrid) {
    const numLines = gridLines || 5;
    for (let g = 0; g <= numLines; g++) {
      const gridY = Math.floor((g / numLines) * (dotsHeight - 1));
      const charY = Math.floor(gridY / 4);
      const dotY = gridY % 4;

      if (charY >= 0 && charY < charHeight) {
        // Draw continuous horizontal line across all characters
        for (let x = 0; x < charWidth; x++) {
          gridGrid[charY]![x]! |= BRAILLE_DOTS[dotY]![0]!; // Left dot
          gridGrid[charY]![x]! |= BRAILLE_DOTS[dotY]![1]!; // Right dot
        }
      }
    }
  }

  // Plot points and connect with lines (into line grid)
  for (let i = 0; i < values.length; i++) {
    const x = Math.floor((i / (values.length - 1)) * (width - 1));
    const normalizedY = (values[i]! - min) / range;
    const y = Math.floor((1 - normalizedY) * (dotsHeight - 1));

    // Set the dot
    const charX = Math.floor(x / 2);
    const charY = Math.floor(y / 4);
    const dotX = x % 2;
    const dotY = y % 4;

    if (charY >= 0 && charY < charHeight && charX >= 0 && charX < charWidth) {
      lineGrid[charY]![charX]! |= BRAILLE_DOTS[dotY]![dotX]!;
    }

    // Draw line to next point
    if (i < values.length - 1) {
      const nextX = Math.floor(((i + 1) / (values.length - 1)) * (width - 1));
      const nextNormalizedY = (values[i + 1]! - min) / range;
      const nextY = Math.floor((1 - nextNormalizedY) * (dotsHeight - 1));

      // Bresenham's line algorithm
      const dx = Math.abs(nextX - x);
      const dy = Math.abs(nextY - y);
      const sx = x < nextX ? 1 : -1;
      const sy = y < nextY ? 1 : -1;
      let err = dx - dy;
      let cx = x, cy = y;

      while (cx !== nextX || cy !== nextY) {
        const cCharX = Math.floor(cx / 2);
        const cCharY = Math.floor(cy / 4);
        const cDotX = cx % 2;
        const cDotY = cy % 4;

        if (cCharY >= 0 && cCharY < charHeight && cCharX >= 0 && cCharX < charWidth) {
          lineGrid[cCharY]![cCharX]! |= BRAILLE_DOTS[cDotY]![cDotX]!;
        }

        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; cx += sx; }
        if (e2 < dx) { err += dx; cy += sy; }
      }
    }
  }

  // Convert grids to Braille characters
  const toStrings = (grid: number[][]): string[] => {
    const result: string[] = [];
    for (let y = 0; y < charHeight; y++) {
      let line = "";
      for (let x = 0; x < charWidth; x++) {
        line += String.fromCharCode(BRAILLE_BASE + grid[y]![x]!);
      }
      result.push(line);
    }
    return result;
  };

  return {
    lines: toStrings(lineGrid),
    gridLines: toStrings(gridGrid),
  };
}
