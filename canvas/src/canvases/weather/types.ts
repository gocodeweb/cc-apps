// Weather Canvas Types - Weather display with forecast

export interface WeatherLocation {
  name: string;        // "New York", "London", etc.
  latitude: number;
  longitude: number;
  timezone?: string;   // "America/New_York", "Europe/London"
}

export interface CurrentWeather {
  temperature: number;     // Current temperature
  weatherCode: number;     // WMO weather code
  windSpeed: number;       // Wind speed
  humidity: number;        // Relative humidity %
  feelsLike?: number;      // Apparent temperature
}

export interface DailyForecast {
  date: string;            // YYYY-MM-DD
  weatherCode: number;     // WMO weather code
  tempMax: number;         // High temperature
  tempMin: number;         // Low temperature
}

export interface WeatherConfig {
  location: WeatherLocation;
  units?: "celsius" | "fahrenheit";
  current?: CurrentWeather;
  forecast?: DailyForecast[];
  title?: string;          // Optional custom title
}

// WMO Weather Code to icon mapping
// https://open-meteo.com/en/docs - WMO Weather interpretation codes (WW)
export const WEATHER_ICONS: Record<number, string> = {
  // Clear
  0: "☀️",
  // Mainly clear, partly cloudy
  1: "🌤️",
  2: "⛅",
  3: "☁️",
  // Fog
  45: "🌫️",
  48: "🌫️",
  // Drizzle
  51: "🌦️",
  53: "🌦️",
  55: "🌦️",
  // Freezing drizzle
  56: "🌨️",
  57: "🌨️",
  // Rain
  61: "🌧️",
  63: "🌧️",
  65: "🌧️",
  // Freezing rain
  66: "🌨️",
  67: "🌨️",
  // Snow
  71: "❄️",
  73: "❄️",
  75: "❄️",
  // Snow grains
  77: "❄️",
  // Rain showers
  80: "🌧️",
  81: "🌧️",
  82: "🌧️",
  // Snow showers
  85: "🌨️",
  86: "🌨️",
  // Thunderstorm
  95: "⛈️",
  96: "⛈️",
  99: "⛈️",
};

// Default icon for unknown weather codes
export const DEFAULT_WEATHER_ICON = "🌡️";

// WMO Weather Code to description
export const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

// Get icon for weather code
export function getWeatherIcon(code: number): string {
  return WEATHER_ICONS[code] || DEFAULT_WEATHER_ICON;
}

// Get description for weather code
export function getWeatherDescription(code: number): string {
  return WEATHER_DESCRIPTIONS[code] || "Unknown";
}

// Format temperature with unit
export function formatTemperature(temp: number, units: "celsius" | "fahrenheit" = "fahrenheit"): string {
  const rounded = Math.round(temp);
  return units === "celsius" ? `${rounded}°C` : `${rounded}°F`;
}

// Format day of week from date string
export function formatDayOfWeek(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

// Convert temperature between units
export function convertTemperature(
  temp: number,
  from: "celsius" | "fahrenheit",
  to: "celsius" | "fahrenheit"
): number {
  if (from === to) return temp;
  if (from === "celsius" && to === "fahrenheit") {
    return (temp * 9) / 5 + 32;
  }
  // fahrenheit to celsius
  return ((temp - 32) * 5) / 9;
}
