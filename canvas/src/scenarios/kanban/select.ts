// Kanban Select Scenario - Select a card from the board

import type { ScenarioDefinition } from "../types";
import type { KanbanConfig, KanbanSelectionResult } from "../../canvases/kanban/types";

export const kanbanSelectScenario: ScenarioDefinition<
  KanbanConfig,
  KanbanSelectionResult
> = {
  name: "select",
  description: "Select a card from the Kanban board",
  canvasKind: "kanban",
  interactionMode: "selection",
  closeOn: "selection",
  defaultConfig: {
    showDescription: true,
    showLabels: true,
    showCardCount: true,
  },
};
