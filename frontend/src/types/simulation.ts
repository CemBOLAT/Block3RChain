export type SimulationPhase = "SETUP" | "SIMULATION";

export interface Simulation {
  id: string;
  name: string;
  nations: Record<string, number>;
}
