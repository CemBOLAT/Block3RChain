"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { ThemeProvider, CssBaseline, Box } from "@mui/material";

import type { ThemeMode } from "@/types/theme";
import { SimulationPhase, Simulation } from "@/types/simulation";
import { gameSetupService } from "@/services/gameSetupService";

import { getAppTheme, toggleTheme } from "@/theme/themeConfig";
import CONFIG from "@/config/appConfig";

import GameSetup from "@/components/setup/GameSetup";
import SimulationView from "@/components/simulation/SimulationView";
import ThemeToggle from "@/components/common/ThemeToggle";
import { useSimulationStore } from "@/store/useSimulationStore";

export default function Home() {
  const [phase, setPhase] = useState<SimulationPhase>("SETUP");
  const simulationId = useSimulationStore((state) => state.simulationId);
  const setSimulationId = useSimulationStore((state) => state.setSimulationId);

  useEffect(() => {
    if (simulationId && phase === "SETUP") {
      setPhase("SIMULATION");
    }
  }, [simulationId, phase]);

  const handleStartSimulation = async (sim: Simulation) => {
    try {
      const response = await gameSetupService.startSimulation(sim);

      if (response && response.simulation_id) {
        setSimulationId(response.simulation_id);
        setPhase("SIMULATION");
      }
    } catch (error) {
      console.error("Failed to start simulation:", error);
    }
  };

  return <>{phase === "SETUP" ? <GameSetup onStart={handleStartSimulation} /> : <SimulationView />}</>;
}
