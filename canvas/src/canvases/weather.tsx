// Weather Canvas - Weather display with forecast

import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useApp, useStdout } from "ink";
import { useIPCServer } from "./calendar/hooks/use-ipc-server";
import type { WeatherConfig, DailyForecast } from "./weather/types";
import {
  getWeatherIcon,
  getWeatherDescription,
  formatTemperature,
  formatDayOfWeek,
  convertTemperature,
} from "./weather/types";

interface Props {
  id: string;
  config?: WeatherConfig;
  socketPath?: string;
  scenario?: string;
}

export function Weather({ id, config: initialConfig, socketPath, scenario = "display" }: Props) {
  const { exit } = useApp();
  const { stdout } = useStdout();

  // Terminal dimensions
  const [dimensions, setDimensions] = useState({
    width: stdout?.columns || 80,
    height: stdout?.rows || 24,
  });

  // Scroll state for forecast list
  const [scrollOffset, setScrollOffset] = useState(0);

  // Live config state (can be updated via IPC)
  const [liveConfig, setLiveConfig] = useState<WeatherConfig | undefined>(initialConfig);

  // Display units (can be toggled with c/f keys)
  const [displayUnits, setDisplayUnits] = useState<"celsius" | "fahrenheit">(
    initialConfig?.units || "fahrenheit"
  );

  // IPC for communicating with Claude
  const ipc = useIPCServer({
    socketPath,
    scenario: scenario || "display",
    onClose: () => exit(),
    onUpdate: (newConfig) => {
      setLiveConfig(newConfig as WeatherConfig);
    },
  });

  // Listen for terminal resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: stdout?.columns || 80,
        height: stdout?.rows || 24,
      });
    };
    stdout?.on("resize", updateDimensions);
    updateDimensions();
    return () => {
      stdout?.off("resize", updateDimensions);
    };
  }, [stdout]);

  // Calculate layout
  const termWidth = dimensions.width;
  const termHeight = dimensions.height;
  const maxBoxWidth = 60;
  const boxWidth = Math.min(termWidth - 4, maxBoxWidth);
  const headerHeight = 6; // Title + current weather
  const footerHeight = 2;
  const viewportHeight = termHeight - headerHeight - footerHeight - 6;

  // Config with defaults
  const config = liveConfig || {
    location: { name: "Unknown", latitude: 0, longitude: 0 },
    units: "fahrenheit" as const,
  };

  const { location, units: sourceUnits = "fahrenheit", current, forecast = [], title } = config;

  // Calculate scroll limits
  const maxScroll = Math.max(0, forecast.length - Math.floor(viewportHeight));

  // Keyboard controls
  useInput((input, key) => {
    // Quit with q or Escape
    if (input === "q" || key.escape) {
      ipc.sendCancelled("User quit");
      exit();
      return;
    }

    // Scroll up
    if (key.upArrow || input === "k") {
      setScrollOffset((o) => Math.max(0, o - 1));
      return;
    }

    // Scroll down
    if (key.downArrow || input === "j") {
      setScrollOffset((o) => Math.min(maxScroll, o + 1));
      return;
    }

    // Page up
    if (key.pageUp) {
      setScrollOffset((o) => Math.max(0, o - Math.floor(viewportHeight)));
      return;
    }

    // Page down
    if (key.pageDown) {
      setScrollOffset((o) => Math.min(maxScroll, o + Math.floor(viewportHeight)));
      return;
    }

    // Toggle to Celsius
    if (input === "c") {
      setDisplayUnits("celsius");
      return;
    }

    // Toggle to Fahrenheit
    if (input === "f") {
      setDisplayUnits("fahrenheit");
      return;
    }
  });

  // Helper to convert and format temperature
  const formatTemp = (temp: number): string => {
    const converted = convertTemperature(temp, sourceUnits, displayUnits);
    return formatTemperature(converted, displayUnits);
  };

  // Render current weather section
  const renderCurrentWeather = () => {
    if (!current) {
      return (
        <Box marginY={1}>
          <Text color="gray">No current weather data</Text>
        </Box>
      );
    }

    const icon = getWeatherIcon(current.weatherCode);
    const description = getWeatherDescription(current.weatherCode);
    const temp = formatTemp(current.temperature);
    const feelsLike = current.feelsLike !== undefined
      ? formatTemp(current.feelsLike)
      : null;

    return (
      <Box flexDirection="column" marginY={1}>
        <Box>
          <Text>
            {icon}  <Text bold color="white">{temp}</Text>
          </Text>
          <Text color="gray">  {description}</Text>
        </Box>
        {feelsLike && (
          <Box marginLeft={3}>
            <Text color="gray">Feels like {feelsLike}</Text>
          </Box>
        )}
        <Box marginTop={1}>
          <Text color="cyan">
            💨 {Math.round(current.windSpeed)} {sourceUnits === "celsius" ? "km/h" : "mph"}
          </Text>
          <Text color="gray">  ·  </Text>
          <Text color="cyan">
            💧 {current.humidity}%
          </Text>
        </Box>
      </Box>
    );
  };

  // Render a single forecast row
  const renderForecastRow = (day: DailyForecast, index: number) => {
    const icon = getWeatherIcon(day.weatherCode);
    const dayName = formatDayOfWeek(day.date);
    const high = formatTemp(day.tempMax);
    const low = formatTemp(day.tempMin);
    const isToday = index === 0;

    return (
      <Box key={day.date} marginBottom={0}>
        <Text color={isToday ? "yellow" : "white"} bold={isToday}>
          {dayName.padEnd(4)}
        </Text>
        <Text>  {icon}  </Text>
        <Text color="red">{high.padStart(5)}</Text>
        <Text color="gray"> / </Text>
        <Text color="blue">{low.padStart(5)}</Text>
        {isToday && <Text color="yellow"> ← today</Text>}
      </Box>
    );
  };

  // Get visible forecast items based on scroll
  const visibleForecast = forecast.slice(
    scrollOffset,
    scrollOffset + Math.floor(viewportHeight)
  );

  return (
    <Box flexDirection="column" width={termWidth} height={termHeight}>
      {/* Title bar - centered */}
      <Box justifyContent="center" marginBottom={0}>
        <Box width={boxWidth} flexDirection="column">
          <Box>
            <Text bold color="cyan">
              🌤️  {title || "Weather"} - {location.name}
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Current weather - centered */}
      <Box justifyContent="center">
        <Box width={boxWidth}>
          {renderCurrentWeather()}
        </Box>
      </Box>

      {/* Forecast section with border - centered */}
      <Box justifyContent="center" flexGrow={1}>
        <Box
          width={boxWidth}
          flexDirection="column"
          borderStyle="round"
          borderColor="cyan"
          paddingX={2}
          paddingY={1}
        >
          <Box marginBottom={1}>
            <Text bold color="white">📅 Forecast</Text>
          </Box>
          {forecast.length === 0 ? (
            <Text color="gray">No forecast data</Text>
          ) : (
            visibleForecast.map((day, idx) => renderForecastRow(day, scrollOffset + idx))
          )}
        </Box>
      </Box>

      {/* Status bar - single line, centered */}
      <Box justifyContent="center">
        <Box width={boxWidth} justifyContent="space-between">
          <Text color="gray" dimColor>
            ↑↓ scroll · <Text color={displayUnits === "celsius" ? "cyan" : "gray"}>c</Text>/<Text color={displayUnits === "fahrenheit" ? "cyan" : "gray"}>f</Text> · q quit
          </Text>
          <Text color="gray" dimColor>
            {forecast.length > 0 && maxScroll > 0
              ? `${scrollOffset + 1}-${Math.min(scrollOffset + Math.floor(viewportHeight), forecast.length)} of ${forecast.length}`
              : `${forecast.length} days`}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
