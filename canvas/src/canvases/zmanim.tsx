// Zmanim Canvas - Jewish halachic times display

import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useApp, useStdout } from "ink";
import { useIPCServer } from "./calendar/hooks/use-ipc-server";
import type { ZmanimConfig, HalachicTime } from "./zmanim/types";
import { ZMAN_ICONS, DEFAULT_ZMAN_ICON } from "./zmanim/types";

interface Props {
  id: string;
  config?: ZmanimConfig;
  socketPath?: string;
  scenario?: string;
}

export function Zmanim({ id, config: initialConfig, socketPath, scenario = "display" }: Props) {
  const { exit } = useApp();
  const { stdout } = useStdout();

  // Terminal dimensions
  const [dimensions, setDimensions] = useState({
    width: stdout?.columns || 80,
    height: stdout?.rows || 24,
  });

  // Scroll state
  const [scrollOffset, setScrollOffset] = useState(0);

  // Live config state (can be updated via IPC)
  const [liveConfig, setLiveConfig] = useState<ZmanimConfig | undefined>(initialConfig);

  // IPC for communicating with Claude
  const ipc = useIPCServer({
    socketPath,
    scenario: scenario || "display",
    onClose: () => exit(),
    onUpdate: (newConfig) => {
      setLiveConfig(newConfig as ZmanimConfig);
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
  const headerHeight = 3;
  const footerHeight = 2;
  const viewportHeight = termHeight - headerHeight - footerHeight - 4;

  // Config with defaults
  const config = liveConfig || {
    date: new Date().toISOString().split("T")[0],
    location: { name: "Unknown", latitude: 0, longitude: 0, timezone: "UTC" },
    times: [],
  };

  const { date, hebrewDate, location, times, title } = config;

  // Calculate scroll limits (each time takes 2 lines: name + hebrew)
  const totalLines = times.length * 2;
  const maxScroll = Math.max(0, Math.ceil(times.length - viewportHeight / 2));

  // Find the next upcoming time (first non-passed time)
  const nextTimeIndex = times.findIndex((t) => !t.passed);

  // Format date nicely
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
      setScrollOffset((o) => Math.max(0, o - Math.floor(viewportHeight / 2)));
      return;
    }

    // Page down
    if (key.pageDown) {
      setScrollOffset((o) => Math.min(maxScroll, o + Math.floor(viewportHeight / 2)));
      return;
    }
  });

  // Get icon for a zman
  const getIcon = (zman: HalachicTime): string => {
    return ZMAN_ICONS[zman.id] || DEFAULT_ZMAN_ICON;
  };

  // Render a single time row
  const renderTimeRow = (zman: HalachicTime, index: number) => {
    const isNext = index === nextTimeIndex;
    const isPassed = zman.passed;
    const icon = getIcon(zman);

    return (
      <Box key={`${zman.id}-${index}`} flexDirection="column" marginBottom={1}>
        <Box>
          <Text dimColor={isPassed}>
            {icon} {zman.name}
          </Text>
          <Box flexGrow={1} />
          <Text bold={isNext} color={isNext ? "yellow" : isPassed ? "gray" : "white"}>
            {zman.time}
          </Text>
          {isNext && <Text color="yellow"> ←</Text>}
        </Box>
        <Box marginLeft={3}>
          <Text dimColor={isPassed} color={isPassed ? "gray" : "cyan"}>
            {zman.hebrewName}
          </Text>
        </Box>
      </Box>
    );
  };

  // Get visible times based on scroll
  const visibleTimes = times.slice(scrollOffset, scrollOffset + Math.ceil(viewportHeight / 2));

  return (
    <Box flexDirection="column" width={termWidth} height={termHeight}>
      {/* Title bar - centered */}
      <Box justifyContent="center" marginBottom={1}>
        <Box width={boxWidth} flexDirection="column">
          <Box>
            <Text bold color="magenta">
              ✡️  {title || "Jewish Times"} - {location.name}
            </Text>
          </Box>
          <Box>
            <Text color="gray">
              📅 {formattedDate}
              {hebrewDate && <Text color="cyan"> · {hebrewDate}</Text>}
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Times list with border - centered */}
      <Box justifyContent="center" flexGrow={1}>
        <Box
          width={boxWidth}
          flexDirection="column"
          borderStyle="round"
          borderColor="magenta"
          paddingX={2}
          paddingY={1}
        >
          {times.length === 0 ? (
            <Text color="gray">No times available</Text>
          ) : (
            visibleTimes.map((zman, idx) => renderTimeRow(zman, scrollOffset + idx))
          )}
        </Box>
      </Box>

      {/* Status bar - single line, centered */}
      <Box justifyContent="center">
        <Box width={boxWidth} justifyContent="space-between">
          <Text color="gray" dimColor>
            ↑↓ scroll · q quit
          </Text>
          <Text color="gray" dimColor>
            {times.length > 0 && maxScroll > 0
              ? `${scrollOffset + 1}-${Math.min(scrollOffset + Math.ceil(viewportHeight / 2), times.length)} of ${times.length}`
              : `${times.length} times`}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
