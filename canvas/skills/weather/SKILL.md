---
name: weather
description: |
  Display current weather and forecast for any location.
  Use when users ask about weather, temperature, or forecast.
---

# Weather Canvas

Display current weather conditions and multi-day forecast for any location.

## IMPORTANT: Spawn Immediately

When the user asks to "show weather" or similar:

1. **If a location is provided** (in ARGUMENTS or user message): Fetch weather from Open-Meteo API for that location, then spawn
2. **If no location**: Default to New York

### Quick spawn example:
```bash
bun run src/cli.ts spawn weather --config '{
  "location": {"name": "New York", "latitude": 40.71, "longitude": -74.01, "timezone": "America/New_York"},
  "units": "fahrenheit",
  "current": {...},
  "forecast": [...]
}'
```

## Open-Meteo API (Free, No API Key Required)

Fetch current weather and forecast:
```
https://api.open-meteo.com/v1/forecast?latitude={LAT}&longitude={LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit={celsius|fahrenheit}&wind_speed_unit={kmh|mph}&timezone=auto
```

### Example API Call
```bash
curl "https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto"
```

### Mapping API Response to Config

```typescript
// From API response:
const response = await fetch(apiUrl).then(r => r.json());

const config: WeatherConfig = {
  location: {
    name: "New York",  // You need to set this
    latitude: response.latitude,
    longitude: response.longitude,
    timezone: response.timezone
  },
  units: "fahrenheit",  // or "celsius"
  current: {
    temperature: response.current.temperature_2m,
    weatherCode: response.current.weather_code,
    windSpeed: response.current.wind_speed_10m,
    humidity: response.current.relative_humidity_2m,
    feelsLike: response.current.apparent_temperature
  },
  forecast: response.daily.time.map((date, i) => ({
    date: date,
    weatherCode: response.daily.weather_code[i],
    tempMax: response.daily.temperature_2m_max[i],
    tempMin: response.daily.temperature_2m_min[i]
  }))
};
```

## Standard Spawn Example

```bash
bun run src/cli.ts spawn weather --config '{
  "location": {
    "name": "New York",
    "latitude": 40.7128,
    "longitude": -74.006,
    "timezone": "America/New_York"
  },
  "units": "fahrenheit",
  "current": {
    "temperature": 72,
    "weatherCode": 1,
    "windSpeed": 8,
    "humidity": 45,
    "feelsLike": 75
  },
  "forecast": [
    {"date": "2026-01-08", "weatherCode": 1, "tempMax": 74, "tempMin": 58},
    {"date": "2026-01-09", "weatherCode": 2, "tempMax": 78, "tempMin": 62},
    {"date": "2026-01-10", "weatherCode": 3, "tempMax": 72, "tempMin": 55},
    {"date": "2026-01-11", "weatherCode": 61, "tempMax": 65, "tempMin": 50},
    {"date": "2026-01-12", "weatherCode": 0, "tempMax": 70, "tempMin": 52},
    {"date": "2026-01-13", "weatherCode": 2, "tempMax": 76, "tempMin": 60},
    {"date": "2026-01-14", "weatherCode": 1, "tempMax": 80, "tempMin": 65}
  ]
}'
```

## Scenarios

### `display` (default)
View-only display of weather with:
- Location header
- Current temperature with weather icon
- Feels like temperature
- Wind speed and humidity
- Multi-day forecast with high/low temps
- Scroll support for long forecasts

## Configuration

```typescript
interface WeatherConfig {
  location: {
    name: string;          // "New York", "London", etc.
    latitude: number;
    longitude: number;
    timezone?: string;     // "America/New_York", "Europe/London"
  };
  units?: "celsius" | "fahrenheit";  // Default: "fahrenheit"
  current?: {
    temperature: number;
    weatherCode: number;   // WMO weather code
    windSpeed: number;
    humidity: number;      // Percentage
    feelsLike?: number;    // Apparent temperature
  };
  forecast?: DailyForecast[];
  title?: string;          // Optional custom title (default: "Weather")
}

interface DailyForecast {
  date: string;            // YYYY-MM-DD
  weatherCode: number;     // WMO weather code
  tempMax: number;         // High temperature
  tempMin: number;         // Low temperature
}
```

## WMO Weather Codes

| Code | Condition | Icon |
|------|-----------|------|
| 0 | Clear sky | ☀️ |
| 1 | Mainly clear | 🌤️ |
| 2 | Partly cloudy | ⛅ |
| 3 | Overcast | ☁️ |
| 45, 48 | Fog | 🌫️ |
| 51-55 | Drizzle | 🌦️ |
| 56-57 | Freezing drizzle | 🌨️ |
| 61-65 | Rain | 🌧️ |
| 66-67 | Freezing rain | 🌨️ |
| 71-77 | Snow | ❄️ |
| 80-82 | Rain showers | 🌧️ |
| 85-86 | Snow showers | 🌨️ |
| 95-99 | Thunderstorm | ⛈️ |

## Controls

- `q` or `Esc`: Quit
- `↑/k`: Scroll up
- `↓/j`: Scroll down
- `PageUp/PageDown`: Page scroll

## Common Locations

| City | Latitude | Longitude | Timezone |
|------|----------|-----------|----------|
| New York | 40.7128 | -74.006 | America/New_York |
| Los Angeles | 34.0522 | -118.2437 | America/Los_Angeles |
| London | 51.5074 | -0.1278 | Europe/London |
| Paris | 48.8566 | 2.3522 | Europe/Paris |
| Tokyo | 35.6762 | 139.6503 | Asia/Tokyo |
| Sydney | -33.8688 | 151.2093 | Australia/Sydney |
| Berlin | 52.52 | 13.405 | Europe/Berlin |
| Toronto | 43.6532 | -79.3832 | America/Toronto |

## Data Source

Weather data is fetched from the [Open-Meteo API](https://open-meteo.com/), which is free and requires no API key for non-commercial use.
