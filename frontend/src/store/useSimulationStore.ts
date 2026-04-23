import { create } from "zustand";
import { toast } from "react-hot-toast";
import CONFIG from "@/config/appConfig";

interface SimulationState {
  simulationId: string | null;
  step: number;
  ledger: Record<string, number>;
  alliances: string[];
  mempool: any | null;
  latest_block_hash: string;
  chain_length: number;
  actionWinner: string | null;
  allianceWinner: string | null;
  currentReward: number;
  setSimulationId: (id: string) => void;
  connectWebSocket: () => void;
  fetchState: () => Promise<void>;
  triggerGodIntervention: (
    countryId: string,
    troopChange: number,
  ) => Promise<void>;
  addCountry: (countryId: string, startingTroops: number) => Promise<void>;
  removeCountry: (countryId: string) => Promise<void>;
  savedSimulations: any[];
  fetchSavedSimulations: () => Promise<void>;
  saveSimulation: (name: string) => Promise<void>;
  deleteSavedSimulation: (id: number) => Promise<void>;
  loadSimulation: (id: number) => Promise<void>;
  chain: any[];
  fetchChain: () => Promise<void>;
}

let wsInstance: WebSocket | null = null;

export const useSimulationStore = create<SimulationState>((set, get) => ({
  simulationId: null,
  step: 0,
  ledger: {},
  alliances: [],
  mempool: null,
  latest_block_hash: "",
  chain_length: 0,
  actionWinner: null,
  allianceWinner: null,
  currentReward: 0,
  savedSimulations: [],
  chain: [],

  setSimulationId: (id: string) => set({ simulationId: id }),

  fetchChain: async () => {
    const { simulationId } = get();
    if (!simulationId) return;
    try {
      const res = await fetch(`${CONFIG.apiBaseUrl}/api/simulation/${simulationId}/chain`);
      const data = await res.json();
      set({ chain: data });
    } catch (e) {
      console.error("Fetch chain error", e);
    }
  },

  saveSimulation: async (name: string) => {
    const { simulationId } = get();
    if (!simulationId) return;
    try {
      const resp = await fetch(`${CONFIG.apiBaseUrl}/api/simulation/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, simulation_id: simulationId }),
      });
      if (resp.ok) {
        toast.success("Simulation saved successfully!");
        get().fetchSavedSimulations(); // Refresh list
      } else {
        toast.error("Failed to save simulation");
      }
    } catch (e) {
      toast.error("Save error!");
    }
  },

  fetchSavedSimulations: async () => {
    try {
      const res = await fetch(`${CONFIG.apiBaseUrl}/api/simulation/saved`);
      const data = await res.json();
      set({ savedSimulations: data });
    } catch (e) {
      console.error("Fetch saved error", e);
    }
  },

  deleteSavedSimulation: async (id: number) => {
    try {
      const resp = await fetch(`${CONFIG.apiBaseUrl}/api/simulation/saved/${id}`, { method: "DELETE" });
      if (resp.ok) {
        toast.success("Saved simulation deleted");
        get().fetchSavedSimulations();
      } else {
        toast.error("Failed to delete simulation");
      }
    } catch (e) {
      toast.error("Delete error!");
    }
  },

  loadSimulation: async (id: number) => {
    try {
      const resp = await fetch(`${CONFIG.apiBaseUrl}/api/simulation/load/${id}`, { method: "POST" });
      const data = await resp.json();
      if (resp.ok) {
        // Disconnect old WS if any
        if (wsInstance) {
          wsInstance.onclose = null;
          wsInstance.close();
          wsInstance = null;
        }
        set({ simulationId: data.simulation_id });
        toast.success("Simulation loaded!");
      } else {
        toast.error("Failed to load simulation");
      }
    } catch (e) {
      toast.error("Load error!");
    }
  },

  connectWebSocket: () => {
    const { simulationId } = get();
    if (wsInstance || !simulationId) return;

    try {
      const wsUrl = CONFIG.apiBaseUrl.replace("http", "ws") + `/ws/state/${simulationId}`;
      wsInstance = new WebSocket(wsUrl);
      
      wsInstance.onopen = () => {
        console.log(`WebSocket connected to Simulation ${simulationId}`);
      };
      
      wsInstance.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const prevState = get();
        
        if (prevState.step > 0 && data.step === 0) {
          toast.success("Consensus Reached: World state updated!", { id: "simulation-complete", duration: 4000 });
        }

        set({
          step: data.step,
          ledger: data.ledger,
          alliances: data.alliances,
          mempool: data.mempool,
          latest_block_hash: data.latest_block_hash,
          chain_length: data.chain_length,
          actionWinner: data.action_winner,
          allianceWinner: data.alliance_winner,
          currentReward: data.current_reward,
        });
      };
      
      wsInstance.onclose = () => {
        console.log("WebSocket disconnected. Retrying...");
        wsInstance = null;
        setTimeout(() => get().connectWebSocket(), 3000);
      };
    } catch (e) {
      console.error("WS error", e);
    }
  },

  fetchState: async () => {
    const { simulationId } = get();
    if (!simulationId) return;

    try {
      const res = await fetch(`${CONFIG.apiBaseUrl}/api/simulation/${simulationId}/state`);
      const data = await res.json();
      set({
        step: data.step,
        ledger: data.ledger,
        alliances: data.alliances,
        mempool: data.mempool,
        latest_block_hash: data.latest_block_hash,
        chain_length: data.chain_length,
        actionWinner: data.action_winner,
        allianceWinner: data.alliance_winner,
        currentReward: data.current_reward,
      });
    } catch (error) {
      console.error("Failed to fetch simulation state", error);
    }
  },

  triggerGodIntervention: async (countryId: string, troopChange: number) => {
    const { simulationId } = get();
    if (!simulationId) return;

    try {
      const resp = await fetch(`${CONFIG.apiBaseUrl}/api/simulation/${simulationId}/god/intervention`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country_id: countryId,
          troop_change: troopChange,
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        const errorMessage = errorData.detail || "Action failed!";
        toast.error(errorMessage);
        return;
      }

      toast.success("God intervention proposal submitted. Awaiting consensus...");
    } catch (error) {
      console.error("Failed to trigger God intervention", error);
      toast.error("Connection error!");
    }
  },

  addCountry: async (countryId: string, startingTroops: number) => {
    const { simulationId } = get();
    if (!simulationId) return;

    try {
      const resp = await fetch(`${CONFIG.apiBaseUrl}/api/simulation/${simulationId}/god/country/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country_id: countryId,
          starting_troops: startingTroops,
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        const errorMessage = errorData.detail || "Action failed!";
        toast.error(errorMessage);
        return;
      }

      toast.success(`Proposal to add ${countryId} submitted. Awaiting nodes...`);
    } catch (error) {
      console.error("Failed to add country", error);
      toast.error("Connection error!");
    }
  },

  removeCountry: async (countryId: string) => {
    const { simulationId } = get();
    if (!simulationId) return;

    try {
      const resp = await fetch(`${CONFIG.apiBaseUrl}/api/simulation/${simulationId}/god/country/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country_id: countryId,
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        const errorMessage = errorData.detail || "Action failed!";
        toast.error(errorMessage);
        return;
      }

      toast.success(`Removal proposal for ${countryId} submitted. Awaiting nodes...`);
    } catch (error) {
      console.error("Failed to remove country", error);
      toast.error("Connection error!");
    }
  },
}));
