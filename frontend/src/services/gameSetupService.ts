import { Simulation, SavedSimulation } from "@/types/simulation";
import CONFIG from "@/config/appConfig";
import { apiRequest } from "@/utils/apiClient";

const API_URL = `${CONFIG.apiBaseUrl}/api/simulation`;

class GameSetupService {
  async getSimulationTemplates(): Promise<Simulation[]> {
    return apiRequest<Simulation[]>(
      `${API_URL}/templates`,
      undefined,
      "An error occurred while fetching simulation templates.",
    );
  }

  async startSimulation(sim: Simulation): Promise<{ simulation_id: string }> {
    return apiRequest<{ simulation_id: string }>(
      `${API_URL}/start`,
      {
        method: "POST",
        body: JSON.stringify(sim),
      },
      "An error occurred while starting the simulation.",
    );
  }

  async getSavedSimulations(): Promise<SavedSimulation[]> {
    return apiRequest<SavedSimulation[]>(
      `${API_URL}/saved`,
      undefined,
      "An error occurred while fetching saved simulations.",
    );
  }

  async deleteSavedSimulation(id: number): Promise<void> {
    return apiRequest<void>(
      `${API_URL}/saved/${id}`,
      { method: "DELETE" },
      "An error occurred while deleting the simulation.",
    );
  }

  async loadSimulation(id: number): Promise<{ simulation_id: string }> {
    return apiRequest<{ simulation_id: string }>(
      `${API_URL}/load/${id}`,
      { method: "POST" },
      "An error occurred while loading the simulation.",
    );
  }

  async saveSimulation(name: string, simulationId: string): Promise<void> {
    return apiRequest<void>(
      `${API_URL}/save`,
      {
        method: "POST",
        body: JSON.stringify({ name, simulation_id: simulationId }),
      },
      "An error occurred while saving the simulation.",
    );
  }
}

export const gameSetupService = new GameSetupService();
