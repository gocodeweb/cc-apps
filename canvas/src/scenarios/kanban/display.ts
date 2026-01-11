// Kanban Display Scenario - View-only board display

import type { ScenarioDefinition } from "../types";
import type { KanbanConfig } from "../../canvases/kanban/types";

export const kanbanDisplayScenario: ScenarioDefinition<KanbanConfig, void> = {
  name: "display",
  description: "View-only Kanban board display",
  canvasKind: "kanban",
  interactionMode: "view-only",
  closeOn: "escape",
  defaultConfig: {
    showDescription: true,
    showLabels: true,
    showCardCount: true,
  },
};
