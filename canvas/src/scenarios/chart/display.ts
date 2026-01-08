import type { ScenarioDefinition } from "../types";
import type { ChartConfig } from "../../canvases/chart/types";

export const chartDisplayScenario: ScenarioDefinition<ChartConfig, void> = {
  name: "display",
  description: "Read-only chart display for data visualization",
  canvasKind: "chart",
  interactionMode: "view-only",
  closeOn: "escape",
  defaultConfig: {
    showLegend: true,
    showValues: true,
    showGrid: true,
  },
};
