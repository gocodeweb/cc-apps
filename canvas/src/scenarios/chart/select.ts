import type { ScenarioDefinition } from "../types";
import type { ChartConfig, ChartSelectionResult } from "../../canvases/chart/types";

export const chartSelectScenario: ScenarioDefinition<
  ChartConfig,
  ChartSelectionResult
> = {
  name: "select",
  description: "Select data points from the chart",
  canvasKind: "chart",
  interactionMode: "selection",
  closeOn: "selection",
  defaultConfig: {
    showLegend: true,
    showValues: true,
    showGrid: true,
  },
};
