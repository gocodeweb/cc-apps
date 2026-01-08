// JSON Select Scenario - Select a path/value from the tree

import type { ScenarioDefinition } from "../types";
import type { JsonConfig, JsonSelectionResult } from "../../canvases/json/types";

export const jsonSelectScenario: ScenarioDefinition<JsonConfig, JsonSelectionResult> = {
  name: "select",
  description: "Select a value or path from the JSON tree",
  canvasKind: "json",
  interactionMode: "selection",
  closeOn: "selection",
  defaultConfig: {
    expandDepth: 2,
    showPath: true,
    showTypes: true,
  },
};
