"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { ThemeProvider, CssBaseline, Box } from "@mui/material";

import type { ThemeMode } from "@/types/theme";
import { SimulationPhase, Simulation } from "@/types/simulation";

import { getAppTheme, toggleTheme } from "@/theme/themeConfig";
import CONFIG from "@/config/appConfig";

import GameSetup from "@/components/setup/GameSetup";
import SimulationView from "@/components/simulation/SimulationView";
import ThemeToggle from "@/components/common/ThemeToggle";

export default function Home() {
  const [phase, setPhase] = useState<SimulationPhase>("SETUP");

  const handleStartSimulation = (sim: Simulation) => {
    console.log("Starting simulation with data:", sim);
    setPhase("SIMULATION");
  };

  return (
    <>
      {phase === "SETUP" ? <GameSetup onStart={handleStartSimulation} /> : <SimulationView />}
    </>
  );
}
