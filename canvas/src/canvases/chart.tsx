// Chart Canvas - Data visualization with bar, line, and pie charts

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Box, Text, useInput, useApp, useStdout } from "ink";
import asciichart from "asciichart";
import { useIPCServer } from "./calendar/hooks/use-ipc-server";
import type {
  ChartConfig,
  ChartSelectionResult,
  SelectableElement,
} from "./chart/types";
import {
  getSeriesColor,
  formatValue,
  calculateBarWidth,
  renderBar,
  calculatePieSlices,
  computeSelectableElements,
  getMaxValue,
  getMinValue,
  renderBrailleLine,
  BAR_CHARS,
  PIE_CHARS,
} from "./chart/types";

interface Props {
  id: string;
  config?: ChartConfig;
  socketPath?: string;
  scenario?: string;
}

export function Chart({
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
  const [liveConfig, setLiveConfig] = useState<ChartConfig | undefined>(
    initialConfig
  );

  // Navigation state
  const [selectedIndex, setSelectedIndex] = useState(0);

  // IPC for communicating with Claude
  const ipc = useIPCServer({
    socketPath,
    scenario: scenario || "display",
    onClose: () => exit(),
    onUpdate: (newConfig) => {
      setLiveConfig(newConfig as ChartConfig);
      setSelectedIndex(0);
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
  const config = liveConfig;

  // Compute selectable elements
  const selectableElements = useMemo(() => {
    return computeSelectableElements(config);
  }, [config]);

  // Handle selection
  const handleSelect = useCallback(() => {
    if (!config || selectableElements.length === 0) return;

    const element = selectableElements[selectedIndex];
    if (!element) return;

    const result: ChartSelectionResult = {
      selectedPoints: [
        {
          seriesIndex: element.seriesIndex,
          seriesName: config.series[element.seriesIndex]?.name || "",
          pointIndex: element.pointIndex,
          label: element.label,
          value: element.value,
        },
      ],
    };
    ipc.sendSelected(result);
    exit();
  }, [config, selectableElements, selectedIndex, ipc, exit]);

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

    if (!config) return;

    const isVerticalNav =
      config.type === "bar-horizontal" || config.type === "pie";

    // Up navigation
    if (key.upArrow || input === "k") {
      if (isVerticalNav) {
        setSelectedIndex((i) => Math.max(0, i - 1));
      }
      return;
    }

    // Down navigation
    if (key.downArrow || input === "j") {
      if (isVerticalNav) {
        setSelectedIndex((i) =>
          Math.min(selectableElements.length - 1, i + 1)
        );
      }
      return;
    }

    // Left navigation
    if (key.leftArrow || input === "h") {
      if (!isVerticalNav) {
        setSelectedIndex((i) => Math.max(0, i - 1));
      }
      return;
    }

    // Right navigation
    if (key.rightArrow || input === "l") {
      if (!isVerticalNav) {
        setSelectedIndex((i) =>
          Math.min(selectableElements.length - 1, i + 1)
        );
      }
      return;
    }

    // Home
    if (input === "g" && !key.shift) {
      setSelectedIndex(0);
      return;
    }

    // End
    if (input === "G") {
      setSelectedIndex(selectableElements.length - 1);
      return;
    }

    // Page navigation
    if (key.pageUp) {
      setSelectedIndex((i) => Math.max(0, i - 10));
      return;
    }

    if (key.pageDown) {
      setSelectedIndex((i) =>
        Math.min(selectableElements.length - 1, i + 10)
      );
      return;
    }

    // Select with Enter
    if (key.return && scenario === "select") {
      handleSelect();
      return;
    }
  });

  // No config - show loading
  if (!config) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="gray">Waiting for chart data...</Text>
      </Box>
    );
  }

  const termWidth = dimensions.width;
  const termHeight = dimensions.height;

  // Calculate available space for chart
  const titleHeight = config.title ? 2 : 0;
  const legendHeight =
    config.showLegend !== false && config.series.length > 1
      ? config.series.length + 1
      : 0;
  const statusHeight = 2;
  const chartHeight = Math.max(
    5,
    termHeight - titleHeight - legendHeight - statusHeight - 2
  );

  // Render based on chart type
  const renderChart = () => {
    switch (config.type) {
      case "line":
        return renderLineChart();
      case "line-smooth":
        return renderSmoothLineChart();
      case "bar":
        return renderVerticalBarChart();
      case "bar-horizontal":
        return renderHorizontalBarChart();
      case "pie":
        return renderPieChart();
      default:
        return <Text color="red">Unknown chart type: {config.type}</Text>;
    }
  };

  // Smooth line chart using Braille characters
  const renderSmoothLineChart = () => {
    const firstSeries = config.series[0];
    if (!firstSeries || firstSeries.data.length === 0) {
      return <Text color="gray">No data to display</Text>;
    }

    const values = firstSeries.data.map((d) => d.value);
    const labels = firstSeries.data.map((d) => d.label);
    const chartWidth = termWidth - 12; // Leave room for y-axis
    const chartHeightRows = config.height || Math.min(chartHeight, 12);
    const dotsHeight = chartHeightRows * 4; // Braille has 4 dot rows per char

    const minVal = getMinValue(config);
    const maxVal = getMaxValue(config);

    // Render Braille line with optional grid
    const showGrid = config.showGrid === true; // default to false now, user must opt-in
    const brailleResult = renderBrailleLine(
      values,
      chartWidth * 2, // 2 dot columns per character
      dotsHeight,
      minVal,
      maxVal,
      showGrid,
      5 // number of grid lines
    );

    const color = firstSeries.color || getSeriesColor(0, config.colors);

    // Build y-axis labels
    const yAxisLabels: string[] = [];
    for (let i = 0; i < brailleResult.lines.length; i++) {
      const ratio = i / (brailleResult.lines.length - 1);
      const val = maxVal - ratio * (maxVal - minVal);
      yAxisLabels.push(formatValue(val, 2).padStart(7));
    }

    // Build x-axis labels
    const labelSpacing = Math.floor(chartWidth / (labels.length - 1));
    let xAxisLine = "";
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i] || "";
      if (i === 0) {
        xAxisLine += label;
      } else if (i === labels.length - 1) {
        const remaining = chartWidth - xAxisLine.length - label.length;
        xAxisLine += " ".repeat(Math.max(1, remaining)) + label;
      } else {
        const targetPos = i * labelSpacing;
        const spacesNeeded = Math.max(1, targetPos - xAxisLine.length);
        xAxisLine += " ".repeat(spacesNeeded) + label;
      }
    }

    // Render each row with grid (dim) and line (colored) characters
    const renderRow = (rowIndex: number) => {
      const lineRow = brailleResult.lines[rowIndex] || "";
      const gridRow = brailleResult.gridLines[rowIndex] || "";
      const BRAILLE_EMPTY = String.fromCharCode(0x2800);

      if (!showGrid) {
        return <Text color={color}>{lineRow}</Text>;
      }

      // Render character by character: grid in dim gray, line in color
      const chars: React.ReactNode[] = [];
      for (let c = 0; c < Math.max(lineRow.length, gridRow.length); c++) {
        const lineChar = lineRow[c] || BRAILLE_EMPTY;
        const gridChar = gridRow[c] || BRAILLE_EMPTY;
        const hasLine = lineChar !== BRAILLE_EMPTY;
        const hasGrid = gridChar !== BRAILLE_EMPTY;

        if (hasLine && hasGrid) {
          // Combine both - merge the braille patterns
          const lineCode = lineChar.charCodeAt(0) - 0x2800;
          const gridCode = gridChar.charCodeAt(0) - 0x2800;
          const combined = String.fromCharCode(0x2800 + (lineCode | gridCode));
          chars.push(<Text key={c} color={color}>{combined}</Text>);
        } else if (hasLine) {
          chars.push(<Text key={c} color={color}>{lineChar}</Text>);
        } else if (hasGrid) {
          chars.push(<Text key={c} color="gray" dimColor>{gridChar}</Text>);
        } else {
          chars.push(<Text key={c}>{BRAILLE_EMPTY}</Text>);
        }
      }
      return <>{chars}</>;
    };

    return (
      <Box flexDirection="column">
        {brailleResult.lines.map((_, i) => (
          <Box key={i}>
            <Text color="gray">{yAxisLabels[i]} </Text>
            {renderRow(i)}
          </Box>
        ))}
        <Box marginTop={0}>
          <Text color="gray">{"        "}{xAxisLine}</Text>
        </Box>
      </Box>
    );
  };

  // Line chart using asciichart
  const renderLineChart = () => {
    const firstSeries = config.series[0];
    if (!firstSeries || firstSeries.data.length === 0) {
      return <Text color="gray">No data to display</Text>;
    }

    const height = config.height || Math.min(chartHeight, 15);
    const labels = firstSeries.data.map((p) => p.label);
    const dataPointCount = firstSeries.data.length;

    // Calculate desired chart width based on labels
    // Each label needs its width + 1 space minimum
    const maxLabelWidth = Math.max(...labels.map((l) => l.length));
    const desiredWidth = Math.max(
      dataPointCount * (maxLabelWidth + 1),
      termWidth - 15 // Leave room for y-axis and padding
    );

    // Interpolate data to make chart wider
    // asciichart uses 1 char per data point, so we need more points for wider chart
    const interpolationFactor = Math.max(1, Math.floor(desiredWidth / dataPointCount));

    const interpolateData = (values: number[]): number[] => {
      if (interpolationFactor <= 1) return values;
      const result: number[] = [];
      for (let i = 0; i < values.length - 1; i++) {
        const start = values[i]!;
        const end = values[i + 1]!;
        for (let j = 0; j < interpolationFactor; j++) {
          const t = j / interpolationFactor;
          result.push(start + (end - start) * t);
        }
      }
      result.push(values[values.length - 1]!); // Add last point
      return result;
    };

    const seriesData = config.series.map((s) =>
      interpolateData(s.data.map((d) => d.value))
    );

    // asciichart colors mapping
    const colorMap: Record<string, number> = {
      green: asciichart.green,
      blue: asciichart.blue,
      yellow: asciichart.yellow,
      magenta: asciichart.magenta,
      cyan: asciichart.cyan,
      red: asciichart.red,
      white: asciichart.default,
    };

    const colors = config.series.map((s, i) => {
      const color = s.color || getSeriesColor(i, config.colors);
      return colorMap[color] || asciichart.default;
    });

    try {
      const chartStr = asciichart.plot(seriesData, {
        height,
        colors,
        padding: "       ",
      });

      const lines = chartStr.split("\n");

      // Highlight selected point if in select mode
      const selectedEl = selectableElements[selectedIndex];

      // Calculate interpolated chart width
      const interpolatedWidth = seriesData[0]?.length || dataPointCount;

      // Build x-axis labels positioned under their data points
      const buildXAxisLabels = () => {
        // Each original data point is at position: i * interpolationFactor
        const labelPositions: { label: string; pos: number }[] = [];
        for (let i = 0; i < dataPointCount; i++) {
          labelPositions.push({
            label: labels[i] || "",
            pos: i * interpolationFactor,
          });
        }

        // Build the label string with proper spacing
        let result = "";
        let currentPos = 0;

        for (const { label, pos } of labelPositions) {
          // Add spaces to reach this position
          const spacesNeeded = Math.max(0, pos - currentPos);
          result += " ".repeat(spacesNeeded);
          result += label;
          currentPos = pos + label.length;
        }

        return result;
      };

      return (
        <Box flexDirection="column">
          {lines.map((line: string, i: number) => (
            <Text key={i}>{line}</Text>
          ))}
          {/* X-axis labels positioned under data points */}
          <Box marginTop={0}>
            <Text color="gray">{"       "}{buildXAxisLabels()}</Text>
          </Box>
          {config.xAxisLabel && (
            <Box justifyContent="center" marginTop={0}>
              <Text color="gray" dimColor>
                {config.xAxisLabel}
              </Text>
            </Box>
          )}
        </Box>
      );
    } catch {
      return <Text color="red">Error rendering line chart</Text>;
    }
  };

  // Vertical bar chart
  const renderVerticalBarChart = () => {
    const series = config.series[0];
    if (!series || series.data.length === 0) {
      return <Text color="gray">No data to display</Text>;
    }

    const maxValue = getMaxValue(config);
    const barCount = series.data.length;
    const barWidth = Math.max(
      3,
      Math.floor((termWidth - 10) / barCount) - 1
    );
    const height = Math.min(chartHeight, 12);

    // Build rows from top to bottom
    const rows: React.ReactNode[] = [];

    for (let row = height - 1; row >= 0; row--) {
      const threshold = ((row + 1) / height) * maxValue;

      const rowContent = series.data.map((point, i) => {
        const isSelected =
          scenario === "select" &&
          selectableElements[selectedIndex]?.pointIndex === i;
        const filled = point.value >= threshold;
        const color = point.color || getSeriesColor(0, config.colors);

        if (filled) {
          return (
            <Text
              key={i}
              color={color}
              backgroundColor={isSelected ? "blue" : undefined}
            >
              {BAR_CHARS.full.repeat(barWidth)}{" "}
            </Text>
          );
        } else {
          return (
            <Text
              key={i}
              backgroundColor={isSelected ? "blue" : undefined}
            >
              {" ".repeat(barWidth + 1)}
            </Text>
          );
        }
      });

      // Y-axis label
      const yLabel =
        row === height - 1
          ? formatValue(maxValue).padStart(6)
          : row === 0
            ? formatValue(0).padStart(6)
            : "      ";

      rows.push(
        <Box key={row}>
          <Text color="gray">{yLabel} </Text>
          {rowContent}
        </Box>
      );
    }

    return (
      <Box flexDirection="column">
        {rows}
        {/* X-axis */}
        <Box>
          <Text color="gray">{"       "}</Text>
          {series.data.map((point, i) => {
            const isSelected =
              scenario === "select" &&
              selectableElements[selectedIndex]?.pointIndex === i;
            const label = point.label.slice(0, barWidth).padEnd(barWidth + 1);
            return (
              <Text
                key={i}
                color={isSelected ? "white" : "gray"}
                backgroundColor={isSelected ? "blue" : undefined}
              >
                {label}
              </Text>
            );
          })}
        </Box>
        {/* Values below bars */}
        {config.showValues !== false && (
          <Box>
            <Text>{"       "}</Text>
            {series.data.map((point, i) => {
              const isSelected =
                scenario === "select" &&
                selectableElements[selectedIndex]?.pointIndex === i;
              const val = formatValue(point.value)
                .slice(0, barWidth)
                .padEnd(barWidth + 1);
              return (
                <Text
                  key={i}
                  color={isSelected ? "white" : "cyan"}
                  backgroundColor={isSelected ? "blue" : undefined}
                >
                  {val}
                </Text>
              );
            })}
          </Box>
        )}
      </Box>
    );
  };

  // Horizontal bar chart
  const renderHorizontalBarChart = () => {
    const series = config.series[0];
    if (!series || series.data.length === 0) {
      return <Text color="gray">No data to display</Text>;
    }

    const maxValue = getMaxValue(config);
    const labelWidth =
      Math.max(...series.data.map((d) => d.label.length)) + 2;
    const barMaxWidth = termWidth - labelWidth - 15;

    return (
      <Box flexDirection="column">
        {series.data.map((point, i) => {
          const isSelected =
            scenario === "select" &&
            selectableElements[selectedIndex]?.pointIndex === i;
          const barWidth = calculateBarWidth(
            point.value,
            maxValue,
            barMaxWidth
          );
          const bar = renderBar(barWidth);
          const color = point.color || getSeriesColor(0, config.colors);

          return (
            <Box key={i}>
              <Text
                backgroundColor={isSelected ? "blue" : undefined}
                color={isSelected ? "white" : "cyan"}
              >
                {point.label.padEnd(labelWidth)}
              </Text>
              <Text color={color}>{bar}</Text>
              {config.showValues !== false && (
                <Text color="gray"> {formatValue(point.value)}</Text>
              )}
            </Box>
          );
        })}
      </Box>
    );
  };

  // Pie chart (rendered as filled circle)
  const renderPieChart = () => {
    const series = config.series[0];
    if (!series || series.data.length === 0) {
      return <Text color="gray">No data to display</Text>;
    }

    const slices = calculatePieSlices(series.data);

    // Circle parameters
    const radius = Math.min(Math.floor((termWidth - 35) / 4), 7);

    // Calculate cumulative percentages for slice boundaries
    let cumulative = 0;
    const sliceAngles = slices.map((slice) => {
      const start = cumulative;
      cumulative += slice.percentage;
      return { ...slice, startPct: start, endPct: cumulative };
    });

    // Build the circle row by row
    const circleRows: React.ReactNode[] = [];

    for (let y = -radius; y <= radius; y++) {
      const rowChars: React.ReactNode[] = [];
      for (let x = -radius * 2; x <= radius * 2; x++) {
        // Adjust x for character aspect ratio (terminal chars are ~2x taller than wide)
        const adjustedX = x / 2;
        const dist = Math.sqrt(adjustedX * adjustedX + y * y);

        // Check if point is inside the circle
        if (dist <= radius + 0.5) {
          // Calculate angle - start from top (12 o'clock), go clockwise
          // atan2(x, -y) gives angle from top going clockwise
          let angle = Math.atan2(adjustedX, -y) * (180 / Math.PI);
          if (angle < 0) angle += 360;
          const pct = (angle / 360) * 100;

          // Find which slice this point belongs to
          let sliceColor = sliceAngles[0]?.point.color || getSeriesColor(0, config.colors);
          let sliceIndex = 0;

          for (let i = 0; i < sliceAngles.length; i++) {
            const slice = sliceAngles[i]!;
            if (pct < slice.endPct) {
              sliceColor = slice.point.color || getSeriesColor(i, config.colors);
              sliceIndex = i;
              break;
            }
          }

          const isSelected = scenario === "select" &&
            selectableElements[selectedIndex]?.pointIndex === sliceIndex;

          rowChars.push(
            <Text
              key={x}
              color={sliceColor}
              backgroundColor={isSelected ? "blue" : undefined}
            >
              {PIE_CHARS.filled}
            </Text>
          );
        } else {
          rowChars.push(<Text key={x}> </Text>);
        }
      }
      circleRows.push(<Box key={y}>{rowChars}</Box>);
    }

    return (
      <Box flexDirection="row">
        {/* Circle */}
        <Box flexDirection="column">
          {circleRows}
        </Box>

        {/* Legend with percentages */}
        <Box flexDirection="column" marginLeft={2} justifyContent="center">
          {slices.map((slice, i) => {
            const isSelected =
              scenario === "select" &&
              selectableElements[selectedIndex]?.pointIndex === i;
            const color =
              slice.point.color || getSeriesColor(i, config.colors);

            return (
              <Box key={i}>
                <Text
                  backgroundColor={isSelected ? "blue" : undefined}
                  color={isSelected ? "white" : undefined}
                >
                  <Text color={color}>{PIE_CHARS.filled}{PIE_CHARS.filled} </Text>
                  {slice.point.label}: {slice.percentage.toFixed(1)}%
                </Text>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  // Render legend for multi-series
  const renderLegend = () => {
    if (config.showLegend === false || config.series.length <= 1) {
      return null;
    }

    return (
      <Box flexDirection="column" marginTop={1}>
        <Text color="gray" dimColor>
          Legend:
        </Text>
        {config.series.map((series, i) => {
          const color = series.color || getSeriesColor(i, config.colors);
          return (
            <Box key={i}>
              <Text color={color}>{BAR_CHARS.full} </Text>
              <Text>{series.name}</Text>
            </Box>
          );
        })}
      </Box>
    );
  };

  // Build help text based on scenario
  const isVerticalNav =
    config.type === "bar-horizontal" || config.type === "pie";
  const navKeys = isVerticalNav ? "\u2191\u2193" : "\u2190\u2192";
  const helpText =
    scenario === "select"
      ? `${navKeys} navigate \u00b7 Enter select \u00b7 q quit`
      : `${navKeys} navigate \u00b7 q quit`;

  const positionText =
    selectableElements.length > 0
      ? `${selectedIndex + 1}/${selectableElements.length}`
      : "";

  return (
    <Box
      flexDirection="column"
      width={termWidth}
      height={termHeight}
      padding={1}
    >
      {/* Title */}
      {config.title && (
        <Box marginBottom={1}>
          <Text bold color="cyan">
            {config.title}
          </Text>
        </Box>
      )}

      {/* Chart */}
      <Box flexDirection="column" flexGrow={1}>
        {renderChart()}
      </Box>

      {/* Legend */}
      {renderLegend()}

      {/* Status bar */}
      <Box marginTop={1} justifyContent="space-between">
        <Text color="gray" dimColor>
          {helpText}
        </Text>
        <Text color="gray" dimColor>
          {positionText}
        </Text>
      </Box>
    </Box>
  );
}

export type { ChartConfig };
