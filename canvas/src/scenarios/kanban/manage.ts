// Kanban Manage Scenario - Move cards between columns

import type { ScenarioDefinition } from "../types";
import type { KanbanConfig, KanbanMoveConfirmResult } from "../../canvases/kanban/types";

export const kanbanManageScenario: ScenarioDefinition<
  KanbanConfig,
  KanbanMoveConfirmResult
> = {
  name: "manage",
  description: "Move cards between columns on the Kanban board",
  canvasKind: "kanban",
  interactionMode: "selection",
  closeOn: "selection",
  defaultConfig: {
    showDescription: true,
    showLabels: true,
    showCardCount: true,
    showWipLimit: true,
  },
};
