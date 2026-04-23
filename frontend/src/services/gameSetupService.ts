import { Simulation } from "@/types/simulation";
import CONFIG from "@/config/appConfig";
import { useErrorStore } from "@/store/useErrorStore";

class GameSetupService {
  async getSimulationTemplates(): Promise<Simulation[]> {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/api/simulation-templates`);
      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      useErrorStore
        .getState()
        .showError(
          "An error occurred while fetching simulation templates. Please try again later.",
          "Connection Error",
        );
      throw error;
    }
  }
}

export const gameSetupService = new GameSetupService();
