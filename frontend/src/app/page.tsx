"use client";

import { SimulationPhase } from "@/types/simulation";
import GameSetup from "@/components/setup/GameSetup";
import SimulationView from "@/components/simulation/SimulationView";
import { useSimulationStore } from "@/store/useSimulationStore";

export default function Home() {
  const simulationId = useSimulationStore((state) => state.simulationId);
  const phase: SimulationPhase = simulationId ? "SIMULATION" : "SETUP";

  return phase === "SETUP" ? <GameSetup /> : <SimulationView />;
}
