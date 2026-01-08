// Table Multi-Select Scenario - Multiple row selection

import type { ScenarioDefinition } from "../types";
import type { TableConfig, TableSelectionResult } from "../../canvases/table/types";

export const tableMultiSelectScenario: ScenarioDefinition<TableConfig, TableSelectionResult> = {
  name: "multi-select",
  description: "Select multiple rows from the table",
  canvasKind: "table",
  interactionMode: "multi-select",
  closeOn: "command", // Closes on Enter after selections made
  defaultConfig: {
    showRowNumbers: true,
    emptyMessage: "No data to select from",
  },
};
