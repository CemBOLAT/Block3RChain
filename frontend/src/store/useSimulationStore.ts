import { create } from "zustand";
import { toast } from "react-hot-toast";
import CONFIG from "@/config/appConfig";
import { apiRequest } from "@/utils/apiClient";
import { AllianceOutcome, Mempool, Block, SimulationStateData } from "@/types/simulation";
import {
  AllianceParameters,
  DEFAULT_ALLIANCE_PARAMETERS,
} from "@/types/allianceParameters";
import {
  GameParameters,
  normalizeGameParameters,
} from "@/types/gameParameters";
import { gameSetupService } from "@/services/gameSetupService";

function mergeAllianceParameters(raw?: Partial<AllianceParameters> | null): AllianceParameters {
  return { ...DEFAULT_ALLIANCE_PARAMETERS, ...raw };
}

interface SimulationState {
  simulationId: string | null;
  step: number;
  ledger: Record<string, number>;
  gold_ledger: Record<string, number>;
  pop_ledger: Record<string, number>;
  castle_ledger: Record<string, number[]>;
  tax_ledger: Record<string, number>;  
  happiness_ledger: Record<string, number>;  
  alliances: string[][];
  alliance_stability_score: number | null;
  alliance_status: AllianceOutcome | null;
  alliance_parameters: AllianceParameters;
  game_parameters: GameParameters;
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
    changes: { troopChange?: number; goldChange?: number; popChange?: number },
  ) => Promise<void>;
  addCountry: (
    countryId: string,
    startingTroops: number,
    startingGold: number,
    startingPopulation: number,
    startingHappiness?: number,
  ) => Promise<void>;
  removeCountry: (countryId: string) => Promise<void>;
  pendingInterventions: Mempool[];
  removePendingIntervention: (index: number) => Promise<void>;
  commitInterventions: () => Promise<void>;
  saveCurrentGame: (name: string) => Promise<void>;
  updateAllianceParameters: (params: AllianceParameters) => Promise<void>;
  updateGameParameters: (params: GameParameters) => Promise<void>;
  buildCastle: (countryId: string, level: number) => Promise<void>;
  demolishCastle: (countryId: string, level: number) => Promise<void>;
  setTaxRate: (countryId: string, rate: number) => Promise<void>;
  chain: Block[];
  fetchChain: () => Promise<void>;
}

let wsInstance: WebSocket | null = null;

export const useSimulationStore = create<SimulationState>((set, get) => ({
  simulationId: null,
  step: 0,
  ledger: {},
  gold_ledger: {},
  pop_ledger: {},
  castle_ledger: {},
  tax_ledger: {},
  happiness_ledger: {},
  alliances: [],
  alliance_stability_score: null,
  alliance_status: null,
  alliance_parameters: { ...DEFAULT_ALLIANCE_PARAMETERS },
  game_parameters: normalizeGameParameters(),
  mempool: null,
  latest_block_hash: "",
  chain_length: 0,
  actionWinner: null,
  allianceWinner: null,
  currentReward: 0,
  pendingInterventions: [],
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
          gold_ledger: data.gold_ledger || {},
          pop_ledger: data.pop_ledger || {},
          castle_ledger: data.castle_ledger || {},
          tax_ledger: data.tax_ledger || {},
          happiness_ledger: data.happiness_ledger || {},
          alliances: data.alliances,
          alliance_stability_score: data.alliance_stability_score ?? null,
          alliance_status: data.alliance_status ?? null,
          alliance_parameters: mergeAllianceParameters(data.alliance_parameters),
          game_parameters: normalizeGameParameters(data.game_parameters),
          mempool: data.mempool,
          latest_block_hash: data.latest_block_hash,
          chain_length: data.chain_length,
          actionWinner: data.action_winner,
          allianceWinner: data.alliance_winner,
          currentReward: data.current_reward,
          pendingInterventions: data.pending_interventions || [],
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
        gold_ledger: data.gold_ledger || {},
        pop_ledger: data.pop_ledger || {},
        castle_ledger: data.castle_ledger || {},
        tax_ledger: (data as SimulationStateData & { tax_ledger?: Record<string, number> }).tax_ledger || {},
        happiness_ledger:
          (data as SimulationStateData & { happiness_ledger?: Record<string, number> }).happiness_ledger || {},
        alliances: data.alliances,
        alliance_stability_score: data.alliance_stability_score ?? null,
        alliance_status: data.alliance_status ?? null,
        alliance_parameters: mergeAllianceParameters(data.alliance_parameters),
        game_parameters: normalizeGameParameters(data.game_parameters),
        mempool: data.mempool,
        latest_block_hash: data.latest_block_hash || "",
        chain_length: data.chain_length,
        actionWinner: data.action_winner,
        allianceWinner: data.alliance_winner,
        currentReward: data.current_reward,
        pendingInterventions: data.pending_interventions || [],
      });
    } catch (error) {
      console.error("Failed to fetch simulation state", error);
    }
  },

  updateAllianceParameters: async (params: AllianceParameters) => {
    const { simulationId } = get();
    if (!simulationId) return;

    try {
      const data = await apiRequest<{ alliance_parameters: AllianceParameters }>(
        `${CONFIG.apiBaseUrl}/api/simulation/${simulationId}/config/alliance_parameters`,
        {
          method: "POST",
          body: JSON.stringify(params),
        },
        "Failed to update alliance parameters.",
      );
      set({ alliance_parameters: mergeAllianceParameters(data.alliance_parameters) });
      toast.success("Alliance parameters updated.");
    } catch (e) {
      const error = e as Error;
      toast.error(error.message);
      throw error;
    }
  },

  updateGameParameters: async (params: GameParameters) => {
    const { simulationId } = get();
    if (!simulationId) return;

    try {
      const data = await apiRequest<{ game_parameters: GameParameters }>(
        `${CONFIG.apiBaseUrl}/api/simulation/${simulationId}/config/game_parameters`,
        {
          method: "POST",
          body: JSON.stringify(params),
        },
        "Failed to update game parameters.",
      );
      set({ game_parameters: normalizeGameParameters(data.game_parameters) });
      toast.success("Game parameters updated.");
    } catch (e) {
      const error = e as Error;
      toast.error(error.message);
      throw error;
    }
  },

  triggerGodIntervention: async (countryId, { troopChange = 0, goldChange = 0, popChange = 0 }) => {
    const { simulationId } = get();
    if (!simulationId) return;

    try {
      await apiRequest(`${CONFIG.apiBaseUrl}/api/simulation/${simulationId}/god/intervention`, {
        method: "POST",
        body: JSON.stringify({
          country_id: countryId,
          troop_change: troopChange,
          gold_change: goldChange,
          pop_change: popChange,
        }),
      });

      let message = `${countryId}: `;
      if (troopChange !== 0) message += `Troops ${troopChange > 0 ? "+" : ""}${troopChange.toLocaleString()} `;
      if (goldChange !== 0) message += `Gold ${goldChange > 0 ? "+" : ""}${goldChange.toLocaleString()} `;
      if (popChange !== 0) message += `Pop ${popChange > 0 ? "+" : ""}${popChange.toLocaleString()}M `;

      toast.success(message);
    } catch (e) {
      const error = e as Error;
      toast.error("Failed to queue intervention: " + error.message);
    }
  },

  addCountry: async (
    countryId,
    startingTroops,
    startingGold,
    startingPopulation,
    startingHappiness,
  ) => {
    const { simulationId } = get();
    if (!simulationId) return;

    try {
      await apiRequest(`${CONFIG.apiBaseUrl}/api/simulation/${simulationId}/god/country/add`, {
        method: "POST",
        body: JSON.stringify({
          country_id: countryId,
          starting_troops: startingTroops,
          starting_gold: startingGold,
          starting_population: startingPopulation,
          starting_happiness: Math.min(100, Math.max(0, startingHappiness)),
        }),
      });
      toast.success(`${countryId} addition queued.`);
    } catch (e) {
      const error = e as Error;
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
      toast.success(`${countryId} removal queued.`);
    } catch (e) {
      const error = e as Error;
      toast.error("Failed to remove country: " + error.message);
    }
  },

  removePendingIntervention: async (index: number) => {
    const { simulationId } = get();
    if (!simulationId) return;

    try {
      await apiRequest(`${CONFIG.apiBaseUrl}/api/simulation/${simulationId}/god/pending/${index}`, {
        method: "DELETE",
      });
      toast.success("Intervention removed from queue.");
    } catch (e) {
      const error = e as Error;
      toast.error("Failed to remove intervention: " + error.message);
    }
  },

  commitInterventions: async () => {
    const { simulationId } = get();
    if (!simulationId) return;

    try {
      await apiRequest(`${CONFIG.apiBaseUrl}/api/simulation/${simulationId}/god/commit`, {
        method: "POST",
      });
      toast.success("Consensus started for all queued interventions!");
    } catch (e) {
      const error = e as Error;
      toast.error("Failed to commit interventions: " + error.message);
    }
  },

  saveCurrentGame: async (name: string) => {
    const { simulationId } = get();
    if (!simulationId) return;
    try {
      await gameSetupService.saveSimulation(name, simulationId);
      toast.success("Simulation saved successfully!");
    } catch (e) {
      const error = e as Error;
      toast.error("Failed to save simulation: " + error.message);
    }
  },

  buildCastle: async (countryId: string, level: number) => {
    const { simulationId } = get();
    if (!simulationId) return;

    try {
      await apiRequest(`${CONFIG.apiBaseUrl}/api/simulation/${simulationId}/god/castle/build`, {
        method: "POST",
        body: JSON.stringify({
          country_id: countryId,
          level: level,
        }),
      });
      toast.success(`Level ${level} Castle construction queued.`);
    } catch (e) {
      const error = e as Error;
      toast.error("Failed to build castle: " + error.message);
    }
  },

  demolishCastle: async (countryId: string, level: number) => {
    const { simulationId } = get();
    if (!simulationId) return;

    try {
      await apiRequest(`${CONFIG.apiBaseUrl}/api/simulation/${simulationId}/god/castle/demolish`, {
        method: "POST",
        body: JSON.stringify({
          country_id: countryId,
          level: level,
        }),
      });
      toast.success(`Level ${level} Castle demolition queued.`);
    } catch (e) {
      const error = e as Error;
      toast.error("Failed to demolish castle: " + error.message);
    }
  },

  setTaxRate: async (countryId: string, rate: number) => {
    const { simulationId } = get();
    if (!simulationId) return;

    try {
      await apiRequest(`${CONFIG.apiBaseUrl}/api/simulation/${simulationId}/god/tax/set`, {
        method: "POST",
        body: JSON.stringify({
          country_id: countryId,
          tax_rate: rate,
        }),
      });
      const displayPct = Math.round(rate * 50);  // 50=full income, 100=2x
      toast.success(`${countryId} tax rate → ${displayPct}%. Queued for next commit.`);
    } catch (e) {
      const error = e as Error;
      toast.error("Failed to set tax rate: " + error.message);
    }
  },
}));
