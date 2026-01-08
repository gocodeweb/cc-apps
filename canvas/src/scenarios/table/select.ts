// Table Select Scenario - Single row selection

import type { ScenarioDefinition } from "../types";
import type { TableConfig, TableSelectionResult } from "../../canvases/table/types";

export const tableSelectScenario: ScenarioDefinition<TableConfig, TableSelectionResult> = {
  name: "select",
  description: "Select a single row from the table",
  canvasKind: "table",
  interactionMode: "selection",
  closeOn: "selection",
  defaultConfig: {
    showRowNumbers: true,
    emptyMessage: "No data to select from",
  },
};
