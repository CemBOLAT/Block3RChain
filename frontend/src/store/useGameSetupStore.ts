import { create } from "zustand";
import { Simulation, SavedSimulation } from "@/types/simulation";
import { gameSetupService } from "@/services/gameSetupService";
import { useSimulationStore } from "./useSimulationStore";
import { toast } from "react-hot-toast";

interface GameSetupState {
  templates: Simulation[];
  savedSimulations: SavedSimulation[];
  selectedTemplate: Simulation | null;
  editableNations: Record<string, { troops: number; gold: number; population: number }>;
  isLoading: boolean;

  // Actions
  fetchTemplates: () => Promise<void>;
  fetchSavedSimulations: () => Promise<void>;
  handleTemplateSelect: (sim: Simulation) => void;
  updateNation: (nation: string, data: Partial<{ troops: number; gold: number; population: number }>) => void;
  removeNation: (nation: string) => void;
  deleteSavedGame: (id: number) => Promise<void>;
  loadGame: (id: number) => Promise<void>;
  startNewGame: () => Promise<void>;
  saveCurrentGame: (name: string) => Promise<void>;

  // UI State
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (val: boolean) => void;
}

export const useGameSetupStore = create<GameSetupState>((set, get) => ({
  templates: [],
  savedSimulations: [],
  selectedTemplate: null,
  editableNations: {},
  isLoading: false,
  isSidebarCollapsed: false,

  fetchTemplates: async () => {
    set({ isLoading: true });
    try {
      const data = await gameSetupService.getSimulationTemplates();
      set({ templates: data });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSavedSimulations: async () => {
    set({ isLoading: true });
    try {
      const data = await gameSetupService.getSavedSimulations();
      set({ savedSimulations: data });
    } finally {
      set({ isLoading: false });
    }
  },

  handleTemplateSelect: (sim: Simulation): void => set({ selectedTemplate: sim, editableNations: { ...sim.nations } }),

  updateNation: (nation: string, data: Partial<{ troops: number; gold: number; population: number }>): void => {
    set((state) => ({
      editableNations: {
        ...state.editableNations,
        [nation]: {
          ...(state.editableNations[nation] || { troops: 10000, gold: 5000, population: 10 }),
          ...data,
        },
      },
    }));
  },

  removeNation: (nation: string): void =>
    set((state) => {
      const next = { ...state.editableNations };
      delete next[nation];
      return { editableNations: next };
    }),

  deleteSavedGame: async (id: number): Promise<void> => {
    try {
      await gameSetupService.deleteSavedSimulation(id);
      toast.success("Saved simulation deleted");
      get().fetchSavedSimulations();
    } catch (e: any) {
      toast.error("Failed to delete simulation: " + e.message);
    }
  },

  loadGame: async (id: number): Promise<void> => {
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

  setSidebarCollapsed: (val: boolean): void => set({ isSidebarCollapsed: val }),
}));
