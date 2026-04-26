import { create } from "zustand";
import { toast } from "react-hot-toast";
import CONFIG from "@/config/appConfig";
import { apiRequest } from "@/utils/apiClient";

import { Mempool, Block, SimulationStateData } from "@/types/simulation";

interface SimulationState {
  simulationId: string | null;
  step: number;
  ledger: Record<string, number>;
  alliances: string[];
  mempool: Mempool | null;
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
  chain: Block[];
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
  chain: [],

  setSimulationId: (id: string) => set({ simulationId: id }),

  fetchChain: async () => {
    const { simulationId } = get();
    if (!simulationId) return;
    try {
      const data = await apiRequest<Block[]>(`${CONFIG.apiBaseUrl}/api/simulation/${simulationId}/chain`);
      set({ chain: data });
    } catch (e) {
      console.error("Fetch chain error", e);
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
      const data = await apiRequest<SimulationStateData>(`${CONFIG.apiBaseUrl}/api/simulation/${simulationId}/state`);
      set({
        step: data.step,
        ledger: data.ledger,
        alliances: data.alliances,
        mempool: data.mempool,
        latest_block_hash: data.latest_block_hash || "",
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
      await apiRequest(`${CONFIG.apiBaseUrl}/api/simulation/${simulationId}/god/intervention`, {
        method: "POST",
        body: JSON.stringify({
          country_id: countryId,
          troop_change: troopChange,
        }),
      });
      toast.success("God intervention proposal submitted. Awaiting consensus...");
    } catch (error) {
      // Error handled by apiRequest
      toast.error("Failed to trigger god intervention: " + error.message);
    }
  },

  addCountry: async (countryId: string, startingTroops: number) => {
    const { simulationId } = get();
    if (!simulationId) return;

    try {
      await apiRequest(`${CONFIG.apiBaseUrl}/api/simulation/${simulationId}/god/country/add`, {
        method: "POST",
        body: JSON.stringify({
          country_id: countryId,
          starting_troops: startingTroops,
        }),
      });
      toast.success(`Proposal to add ${countryId} submitted. Awaiting nodes...`);
    } catch (error) {
      // Error handled by apiRequest
      toast.error("Failed to add country: " + error.message);
    }
  },

  removeCountry: async (countryId: string) => {
    const { simulationId } = get();
    if (!simulationId) return;

    try {
      await apiRequest(`${CONFIG.apiBaseUrl}/api/simulation/${simulationId}/god/country/remove`, {
        method: "POST",
        body: JSON.stringify({
          country_id: countryId,
        }),
      });
      toast.success(`Removal proposal for ${countryId} submitted. Awaiting nodes...`);
    } catch (error) {
      // Error handled by apiRequest
      toast.error("Failed to remove country: " + error.message);
    }
  },
}));
