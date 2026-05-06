import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { Simulation, SavedSimulation } from "@/types/simulation";
import { gameSetupService } from "@/services/gameSetupService";
import { useSimulationStore } from "./useSimulationStore";
import { toast } from "react-hot-toast";

interface GameSetupState {
  templates: Simulation[];
  savedSimulations: SavedSimulation[];
  selectedTemplate: Simulation | null;
  editableNations: Record<string, { troops: number; gold: number; population: number }>;

  // Actions
  fetchTemplates: () => Promise<void>;
  fetchSavedSimulations: () => Promise<void>;
  updateNation: (nation: string, data: Partial<{ troops: number; gold: number; population: number }>) => void;
  removeNation: (nation: string) => void;
  deleteSavedSimulation: (id: number) => Promise<void>;
  loadSimulation: (id: number) => Promise<void>;
  selectTemplateById: (id: string) => void;
  startNewGame: () => Promise<void>;
  saveCurrentGame: (name: string) => Promise<void>;

  // UI State
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (val: boolean) => void;
}

export const useGameSetupStore = create<GameSetupState>()(
  immer((set, get) => ({
    templates: [],
    savedSimulations: [],
    selectedTemplate: null,
    editableNations: {},
    isSidebarCollapsed: false,

    fetchTemplates: async () => {
      try {
        const data = await gameSetupService.getSimulationTemplates();
        set((state) => {
          state.templates = data;
        });
      } catch (e: any) {
        toast.error("Failed to fetch templates: " + e.message);
      }
    },

    fetchSavedSimulations: async () => {
      try {
        const data = await gameSetupService.getSavedSimulations();
        set((state) => {
          state.savedSimulations = data;
        });
      } catch (e: any) {
        toast.error("Failed to fetch saved games: " + e.message);
      }
    },

    selectTemplateById: (id: string): void => {
      const { templates } = get();
      const sim = templates.find((t) => t.id === id);
      if (sim) {
        set((state) => {
          state.selectedTemplate = sim;
          state.editableNations = { ...sim.nations };
        });
      }
    },

    updateNation: (nation: string, data: Partial<{ troops: number; gold: number; population: number }>): void => {
      set((state) => {
        if (!state.editableNations[nation]) {
          state.editableNations[nation] = { troops: 10000, gold: 5000, population: 10 };
        }
        Object.assign(state.editableNations[nation], data);
      });
    },

    removeNation: (nation: string): void => {
      set((state) => {
        delete state.editableNations[nation];
      });
    },

    deleteSavedSimulation: async (id: number): Promise<void> => {
      try {
        await gameSetupService.deleteSavedSimulation(id);
        toast.success("Saved simulation deleted");
        get().fetchSavedSimulations();
      } catch (e: any) {
        toast.error("Failed to delete simulation: " + e.message);
      }
    },

    loadSimulation: async (id: number): Promise<void> => {
      try {
        const data = await gameSetupService.loadSimulation(id);
        useSimulationStore.getState().setSimulationId(data.simulation_id);
        toast.success("Simulation loaded!");
      } catch (e: any) {
        toast.error("Failed to load simulation: " + e.message);
      }
    },

    startNewGame: async (): Promise<void> => {
      const { selectedTemplate, editableNations } = get();
      try {
        const simData: Simulation = {
          id: "",
          name: selectedTemplate?.name || "New Simulation",
          nations: editableNations,
        };
        const data = await gameSetupService.startSimulation(simData);
        useSimulationStore.getState().setSimulationId(data.simulation_id);
        toast.success("Simulation started!");
      } catch (e: any) {
        toast.error("Failed to start simulation: " + e.message);
      }
    },

    saveCurrentGame: async (name: string): Promise<void> => {
      const simulationId = useSimulationStore.getState().simulationId;
      if (!simulationId) return;
      try {
        await gameSetupService.saveSimulation(name, simulationId);
        toast.success("Simulation saved successfully!");
        get().fetchSavedSimulations();
      } catch (e: any) {
        toast.error("Failed to save simulation: " + e.message);
      }
    },

    setSidebarCollapsed: (val: boolean): void => {
      set((state) => {
        state.isSidebarCollapsed = val;
      });
    },
  })),
);
