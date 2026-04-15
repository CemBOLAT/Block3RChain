import { create } from "zustand";

interface SimulationState {
  step: number;
  ledger: Record<string, number>;
  alliances: string[];
  mempool: any | null;
  latest_block_hash: string;
  chain_length: number;
  connectWebSocket: () => void;
  fetchState: () => Promise<void>;
  triggerGodIntervention: (
    countryId: string,
    troopChange: number,
  ) => Promise<void>;
}

const API_URL = "http://127.0.0.1:8000";
const WS_URL = "ws://127.0.0.1:8000/ws/state";

let wsInstance: WebSocket | null = null;

export const useSimulationStore = create<SimulationState>((set, get) => ({
  step: 0,
  ledger: {},
  alliances: [],
  mempool: null,
  latest_block_hash: "",
  chain_length: 0,

  connectWebSocket: () => {
    if (wsInstance) return;
    try {
      wsInstance = new WebSocket(WS_URL);
      wsInstance.onopen = () => {
        console.log("WebSocket connected to Backend orchestrator");
      };
      wsInstance.onmessage = (event) => {
        const data = JSON.parse(event.data);
        set({
          step: data.step,
          ledger: data.ledger,
          alliances: data.alliances,
          mempool: data.mempool,
          latest_block_hash: data.latest_block_hash,
          chain_length: data.chain_length,
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
    // Left as fallback just in case
    try {
      const res = await fetch(`${API_URL}/api/state`);
      const data = await res.json();
      set({
        step: data.step,
        ledger: data.ledger,
        alliances: data.alliances,
        mempool: data.mempool,
        latest_block_hash: data.latest_block_hash,
        chain_length: data.chain_length,
      });
    } catch (error) {
      console.error("Failed to fetch simulation state", error);
    }
  },

  triggerGodIntervention: async (countryId: string, troopChange: number) => {
    try {
      await fetch(`${API_URL}/api/god/intervention`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country_id: countryId,
          troop_change: troopChange,
        }),
      });
    } catch (error) {
      console.error("Failed to trigger God intervention", error);
    }
  },
}));
