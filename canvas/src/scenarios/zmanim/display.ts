// Zmanim Display Scenario - Read-only halachic times view

import type { ScenarioDefinition } from "../types";
import type { ZmanimConfig } from "../../canvases/zmanim/types";

export const zmanimDisplayScenario: ScenarioDefinition<ZmanimConfig, void> = {
  name: "display",
  description: "Display Jewish halachic times for a date and location",
  canvasKind: "zmanim",
  interactionMode: "view-only",
  closeOn: "escape",
  defaultConfig: {
    date: new Date().toISOString().split("T")[0],
    location: {
      name: "Jerusalem",
      latitude: 31.7683,
      longitude: 35.2137,
      timezone: "Asia/Jerusalem",
    },
    times: [],
  },
};
