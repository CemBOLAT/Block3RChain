import { Simulation } from "@/types/simulation";
import CONFIG from "@/config/appConfig";
import { useErrorStore } from "@/store/useErrorStore";

class GameSetupService {
  async getSimulationTemplates(): Promise<Simulation[]> {
    let response: Response;

    try {
      response = await fetch(`${CONFIG.apiBaseUrl}/api/simulation-templates`);
    } catch (error) {
      useErrorStore
        .getState()
        .showError(
          "Could not connect to the backend service. Please ensure the server is running.",
          "Connection Error",
          false,
        );
      throw error;
    }

    if (!response.ok) {
      let errorMessage = "An error occurred while fetching simulation templates.";

      if (response.status >= 400 && response.status < 500) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {}
      }

      useErrorStore.getState().showError(errorMessage, "Service Error", false);
      throw new Error(errorMessage);
    }

    return await response.json();
  }
}

export const gameSetupService = new GameSetupService();
