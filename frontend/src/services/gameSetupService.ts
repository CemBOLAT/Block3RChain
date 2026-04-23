import { Simulation } from "@/types/simulation";
import CONFIG from "@/config/appConfig";
import { apiRequest } from "@/utils/apiClient";

const API_URL = `${CONFIG.apiBaseUrl}/api/simulation`;

class GameSetupService {
  async getSimulationTemplates(): Promise<Simulation[]> {
    return apiRequest<Simulation[]>(
      `${API_URL}/templates`,
      undefined,
      "An error occurred while fetching simulation templates."
    );
  }

  async startSimulation(sim: Simulation): Promise<{ simulation_id: string }> {
    return apiRequest<{ simulation_id: string }>(
      `${API_URL}/start`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sim),
      },
      "An error occurred while starting the simulation."
    );
  }
}

export const gameSetupService = new GameSetupService();
