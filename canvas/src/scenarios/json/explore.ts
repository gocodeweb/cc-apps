// JSON Explore Scenario - Read-only tree navigation

import type { ScenarioDefinition } from "../types";
import type { JsonConfig } from "../../canvases/json/types";

export const jsonExploreScenario: ScenarioDefinition<JsonConfig, void> = {
  name: "explore",
  description: "Interactive JSON tree explorer with expand/collapse",
  canvasKind: "json",
  interactionMode: "view-only",
  closeOn: "escape",
  defaultConfig: {
    expandDepth: 2,
    showPath: true,
    showTypes: true,
  },
};
