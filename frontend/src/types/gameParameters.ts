export interface GameParameters {
  block_reward: number;
  
  // Level 1 Castle
  castle_build_cost_l1: number;
  castle_maintenance_l1: number;
  castle_defense_l1: number;

  // Level 2 Castle
  castle_build_cost_l2: number;
  castle_maintenance_l2: number;
  castle_defense_l2: number;

  // Level 3 Castle
  castle_build_cost_l3: number;
  castle_maintenance_l3: number;
  castle_defense_l3: number;
}

export const DEFAULT_GAME_PARAMETERS: GameParameters = {
  block_reward: 1000,

  castle_build_cost_l1: 2000,
  castle_maintenance_l1: 1000,
  castle_defense_l1: 10000,

  castle_build_cost_l2: 5000,
  castle_maintenance_l2: 2000,
  castle_defense_l2: 25000,

  castle_build_cost_l3: 10000,
  castle_maintenance_l3: 5000,
  castle_defense_l3: 50000,
};

export type GameParameterKey = keyof GameParameters;

export const GAME_PARAMETER_BOUNDS: Record<GameParameterKey, { min: number; max: number; step: number }> = {
  block_reward: { min: 0, max: 10000, step: 1000 },

  // L1: build 0-20K (1K steps), maintenance 0-10K (1K steps), defense 0-100K (10K steps)
  castle_build_cost_l1: { min: 0, max: 20000, step: 1000 },
  castle_maintenance_l1: { min: 0, max: 10000, step: 1000 },
  castle_defense_l1: { min: 0, max: 100000, step: 10000 },

  // L2: build 0-50K (1K steps), maintenance 0-20K (1K steps), defense 0-250K (25K steps)
  castle_build_cost_l2: { min: 0, max: 50000, step: 1000 },
  castle_maintenance_l2: { min: 0, max: 20000, step: 1000 },
  castle_defense_l2: { min: 0, max: 250000, step: 25000 },

  // L3: build 0-100K (1K steps), maintenance 0-50K (1K steps), defense 0-500K (50K steps)
  castle_build_cost_l3: { min: 0, max: 100000, step: 1000 },
  castle_maintenance_l3: { min: 0, max: 50000, step: 1000 },
  castle_defense_l3: { min: 0, max: 500000, step: 50000 },
};

export const GAME_PARAMETER_HELP: Record<
  GameParameterKey,
  { label: string; tooltip: string }
> = {
  block_reward: {
    label: "Block Mining Reward",
    tooltip: "The amount of troops rewarded to the nation that successfully mines a block.",
  },
  castle_build_cost_l1: {
    label: "L1 Build Cost",
    tooltip: "Gold cost required to build a Level 1 Castle.",
  },
  castle_maintenance_l1: {
    label: "L1 Monthly Maintenance",
    tooltip: "Monthly gold cost deducted from the country treasury to support a Level 1 Castle.",
  },
  castle_defense_l1: {
    label: "L1 Defense Power",
    tooltip: "Additional defense power added to the country's military strength in solver evaluations.",
  },
  castle_build_cost_l2: {
    label: "L2 Build Cost",
    tooltip: "Gold cost required to build a Level 2 Castle.",
  },
  castle_maintenance_l2: {
    label: "L2 Monthly Maintenance",
    tooltip: "Monthly gold cost deducted from the country treasury to support a Level 2 Castle.",
  },
  castle_defense_l2: {
    label: "L2 Defense Power",
    tooltip: "Additional defense power added to the country's military strength in solver evaluations.",
  },
  castle_build_cost_l3: {
    label: "L3 Build Cost",
    tooltip: "Gold cost required to build a Level 3 Castle.",
  },
  castle_maintenance_l3: {
    label: "L3 Monthly Maintenance",
    tooltip: "Monthly gold cost deducted from the country treasury to support a Level 3 Castle.",
  },
  castle_defense_l3: {
    label: "L3 Defense Power",
    tooltip: "Additional defense power added to the country's military strength in solver evaluations.",
  },
};

export function formatGameParameterValue(key: GameParameterKey, v: number): string {
  if (v === 0) return "0";
  if (key.includes("cost") || key.includes("maintenance")) {
    return `${v}K 💰`;
  }
  return `${v}K`;
}

export function clampGameParameter(key: GameParameterKey, raw: number): number {
  const { min, max } = GAME_PARAMETER_BOUNDS[key];
  if (!Number.isFinite(raw)) {
    return DEFAULT_GAME_PARAMETERS[key];
  }
  return Math.min(max, Math.max(min, raw));
}
