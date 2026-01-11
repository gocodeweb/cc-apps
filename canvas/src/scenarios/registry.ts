// Scenario Registry - Central lookup for all scenarios

import type { ScenarioDefinition } from "./types";
import { displayScenario } from "./calendar/display";
import { meetingPickerScenario } from "./calendar/meeting-picker";
import { documentDisplayScenario } from "./document/display";
import { documentEditScenario } from "./document/edit";
import { emailPreviewScenario } from "./document/email-preview";
import { zmanimDisplayScenario } from "./zmanim/display";
import { tableDisplayScenario } from "./table/display";
import { tableSelectScenario } from "./table/select";
import { tableMultiSelectScenario } from "./table/multi-select";
import { jsonExploreScenario } from "./json/explore";
import { jsonSelectScenario } from "./json/select";
import { weatherDisplayScenario } from "./weather/display";
import { chartDisplayScenario } from "./chart/display";
import { chartSelectScenario } from "./chart/select";
import { kanbanDisplayScenario } from "./kanban/display";
import { kanbanSelectScenario } from "./kanban/select";
import { kanbanManageScenario } from "./kanban/manage";

// Registry of all scenarios keyed by "canvasKind:scenarioName"
const registry = new Map<string, ScenarioDefinition>();

// Register calendar scenarios
registry.set("calendar:display", displayScenario);
registry.set("calendar:meeting-picker", meetingPickerScenario);

// Register document scenarios
registry.set("document:display", documentDisplayScenario);
registry.set("document:edit", documentEditScenario);
registry.set("document:email-preview", emailPreviewScenario);

// Register zmanim scenarios
registry.set("zmanim:display", zmanimDisplayScenario);

// Register table scenarios
registry.set("table:display", tableDisplayScenario);
registry.set("table:select", tableSelectScenario);
registry.set("table:multi-select", tableMultiSelectScenario);

// Register json scenarios
registry.set("json:explore", jsonExploreScenario);
registry.set("json:select", jsonSelectScenario);

// Register weather scenarios
registry.set("weather:display", weatherDisplayScenario);

// Register chart scenarios
registry.set("chart:display", chartDisplayScenario);
registry.set("chart:select", chartSelectScenario);

// Register kanban scenarios
registry.set("kanban:display", kanbanDisplayScenario);
registry.set("kanban:select", kanbanSelectScenario);
registry.set("kanban:manage", kanbanManageScenario);

export function getScenario(
  canvasKind: string,
  scenarioName: string
): ScenarioDefinition | undefined {
  return registry.get(`${canvasKind}:${scenarioName}`);
}

export function listScenarios(canvasKind?: string): ScenarioDefinition[] {
  const scenarios: ScenarioDefinition[] = [];
  for (const [key, scenario] of registry) {
    if (!canvasKind || key.startsWith(`${canvasKind}:`)) {
      scenarios.push(scenario);
    }
  }
  return scenarios;
}

export function registerScenario(scenario: ScenarioDefinition): void {
  registry.set(`${scenario.canvasKind}:${scenario.name}`, scenario);
}
