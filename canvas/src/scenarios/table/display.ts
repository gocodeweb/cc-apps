// Table Display Scenario - Read-only table viewer

import type { ScenarioDefinition } from "../types";
import type { TableConfig } from "../../canvases/table/types";

export const tableDisplayScenario: ScenarioDefinition<TableConfig, void> = {
  name: "display",
  description: "Read-only table display for viewing tabular data",
  canvasKind: "table",
  interactionMode: "view-only",
  closeOn: "escape",
  defaultConfig: {
    showRowNumbers: true,
    emptyMessage: "No data to display",
  },
};
