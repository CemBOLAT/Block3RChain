import { create } from "zustand";
import { Simulation, SavedSimulation } from "@/types/simulation";
import { gameSetupService } from "@/services/gameSetupService";
import { useSimulationStore } from "./useSimulationStore";
import { toast } from "react-hot-toast";

interface GameSetupState {
  templates: Simulation[];
  savedSimulations: SavedSimulation[];
  selectedTemplate: Simulation | null;
  editableName: string;
  editableNations: Record<string, number>;
  isLoading: boolean;

  // Actions
  fetchTemplates: () => Promise<void>;
  fetchSavedSimulations: () => Promise<void>;
  handleTemplateSelect: (sim: Simulation) => void;
  setEditableName: (name: string) => void;
  updateTroopCount: (nation: string, count: number) => void;
  removeNation: (nation: string) => void;
  deleteSavedGame: (id: number) => Promise<void>;
  loadGame: (id: number) => Promise<void>;
  startNewGame: () => Promise<void>;
  saveCurrentGame: (name: string) => Promise<void>;
  isInNationList: (name: string) => boolean;

  // UI State
  isSidebarCollapsed: boolean;
  pendingAddCountry: string | null;
  setSidebarCollapsed: (val: boolean) => void;
  handleCountryClick: (name: string) => void;
  consumePendingCountry: () => void;
}

export const useGameSetupStore = create<GameSetupState>((set, get) => ({
  templates: [],
  savedSimulations: [],
  selectedTemplate: null,
  editableName: "",
  editableNations: {},
  isLoading: false,
  isSidebarCollapsed: false,
  pendingAddCountry: null,

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

  handleTemplateSelect: (sim: Simulation) => {
    set({
      selectedTemplate: sim,
      editableName: sim.name,
      editableNations: { ...sim.nations },
    });
  },

  setEditableName: (name: string) => set({ editableName: name }),

  updateTroopCount: (nation: string, count: number) => {
    set((state) => ({
      editableNations: {
        ...state.editableNations,
        [nation]: Math.max(0, count),
      },
    }));
  },

  removeNation: (nation: string) => {
    set((state) => {
      const next = { ...state.editableNations };
      delete next[nation];
      return { editableNations: next };
    });
  },

  deleteSavedGame: async (id: number) => {
    try {
      await gameSetupService.deleteSavedSimulation(id);
      toast.success("Saved simulation deleted");
      get().fetchSavedSimulations();
    } catch (e) {
      // Error handled by apiRequest
    }
  },

  loadGame: async (id: number) => {
    try {
      const data = await gameSetupService.loadSimulation(id);
      useSimulationStore.getState().setSimulationId(data.simulation_id);
      toast.success("Simulation loaded!");
    } catch (e) {
      // Error handled by apiRequest
    }
  },

  startNewGame: async () => {
    const { editableName, editableNations } = get();
    try {
      const simData: Simulation = {
        id: "", // Backend generates UUID
        name: editableName,
        nations: editableNations,
      };
      const data = await gameSetupService.startSimulation(simData);
      useSimulationStore.getState().setSimulationId(data.simulation_id);
      toast.success("Simulation started!");
    } catch (e) {
      // Error handled by apiRequest
    }
  },

  saveCurrentGame: async (name: string) => {
    const simulationId = useSimulationStore.getState().simulationId;
    if (!simulationId) return;

    try {
      await gameSetupService.saveSimulation(name, simulationId);
      toast.success("Simulation saved successfully!");
      get().fetchSavedSimulations(); // Refresh list
    } catch (e) {
      // Error handled by apiRequest
    }
  },

  isInNationList: (name: string) => {
    return get().editableNations[name] !== undefined;
  },

  setSidebarCollapsed: (val: boolean) => set({ isSidebarCollapsed: val }),

  handleCountryClick: (name: string) => {
    const alreadyInList = get().isInNationList(name);
    if (!alreadyInList) {
      set({
        pendingAddCountry: name,
        isSidebarCollapsed: false,
      });
    }
  },

  consumePendingCountry: () => set({ pendingAddCountry: null }),
}));
