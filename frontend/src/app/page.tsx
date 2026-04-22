"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { ThemeProvider, CssBaseline, Box } from "@mui/material";

import type { ThemeMode } from "@/types/theme";
import type { SimulationPhase } from "@/types/simulation";

import { getAppTheme, toggleTheme } from "@/theme/themeConfig";
import CONFIG from "@/config/appConfig";

import GameSetup from "@/components/GameSetup";
import SimulationView from "@/components/SimulationView";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  const [mode, setMode] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<SimulationPhase>("SETUP");

  const theme = useMemo(() => getAppTheme(mode), [mode]);

  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem(CONFIG.themeStorageKey) as ThemeMode;
    if (savedMode === "light" || savedMode === "dark") {
      setMode(savedMode);
    }
  }, []);

  const handleToggleMode = () => {
    setMode((prev) => toggleTheme(prev));
  };

  const handleStartSimulation = () => {
    setPhase("SIMULATION");
  };

  if (!mounted) return null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ position: "fixed", bottom: 24, left: 24, zIndex: 9999 }}>
        <ThemeToggle mode={mode} toggleMode={handleToggleMode} />
      </Box>
      {phase === "SETUP" ? <GameSetup onStart={handleStartSimulation} /> : <SimulationView />}
    </ThemeProvider>
  );
}
