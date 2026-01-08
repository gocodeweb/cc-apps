// Weather Display Scenario - Read-only weather view with forecast

import type { ScenarioDefinition } from "../types";
import type { WeatherConfig } from "../../canvases/weather/types";

export const weatherDisplayScenario: ScenarioDefinition<WeatherConfig, void> = {
  name: "display",
  description: "Display current weather and forecast for a location",
  canvasKind: "weather",
  interactionMode: "view-only",
  closeOn: "escape",
  defaultConfig: {
    location: {
      name: "New York",
      latitude: 40.7128,
      longitude: -74.006,
      timezone: "America/New_York",
    },
    units: "fahrenheit",
  },
};
