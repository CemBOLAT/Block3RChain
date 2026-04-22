import { create } from "zustand";
import { toast } from "react-hot-toast";

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
  addCountry: (countryId: string, startingTroops: number) => Promise<void>;
  removeCountry: (countryId: string) => Promise<void>;
}

const API_URL = "http://localhost:8000";
const WS_URL = "ws://localhost:8000/ws/state";

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
        const prevState = get();
        
        // Completion detection: if step was > 0 and now is 0, show success toast
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
      const resp = await fetch(`${API_URL}/api/god/intervention`, {
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
    try {
      const resp = await fetch(`${API_URL}/api/god/country/add`, {
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
    try {
      const resp = await fetch(`${API_URL}/api/god/country/remove`, {
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
