export type SimulationPhase = "SETUP" | "SIMULATION";

export interface Simulation {
  id: string;
  name: string;
  nations: Record<string, number>;
}

export interface NationAddProps {
  name: string;
  troops: number;
}

export interface SavedSimulation {
  id: number;
  name: string;
  timestamp: string;
  ledger: Record<string, number>;
  alliances: string[];
}
