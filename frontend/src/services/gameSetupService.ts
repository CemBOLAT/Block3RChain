import { Simulation } from "@/types/simulation";

class GameSetupService {
  async getSimulationTemplates(): Promise<Simulation[]> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    return [
      {
        id: "1",
        name: "Balkan Equilibrium",
        nations: {
          Turkey: 10000,
          Greece: 10000,
          Bulgaria: 10000,
          Serbia: 10000,
          Romania: 10000,
          Hungary: 10000,
        },
      },
      {
        id: "2",
        name: "Eastern Tensions",
        nations: {
          Turkey: 25000,
          Greece: 12000,
          Bulgaria: 8000,
          Russia: 40000,
        },
      },
      {
        id: "3",
        name: "Custom Crisis",
        nations: {
          Turkey: 5000,
          Syria: 15000,
          Iraq: 12000,
        },
      },
    ];
  }
}

export const gameSetupService = new GameSetupService();
