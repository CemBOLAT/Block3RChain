export interface CastleParameters {
  build_cost: number;
  maintenance: number;
  defense: number;
}
export type CastleParameterKey = keyof CastleParameters;
export type CastleLevel = 1 | 2 | 3;
export const CASTLE_LEVELS: readonly CastleLevel[] = [1, 2, 3];
export const CASTLE_PARAMETER_KEYS: readonly CastleParameterKey[] = ["build_cost", "maintenance", "defense"];

export interface GameParameters {
  block_reward: number;
  castles: Record<CastleLevel, CastleParameters>;
}

export type ParameterBound = { min: number; max: number; step: number };

export const DEFAULT_GAME_PARAMETERS: GameParameters = {
  block_reward: 1000,
  castles: {
    1: { build_cost: 2000, maintenance: 1000, defense: 10000 },
    2: { build_cost: 5000, maintenance: 2000, defense: 25000 },
    3: { build_cost: 10000, maintenance: 5000, defense: 50000 },
  },
};

export const BLOCK_REWARD_BOUNDS: ParameterBound = { min: 0, max: 10000, step: 1000 };

export const CASTLE_LEVEL_BOUNDS: Record<CastleLevel, Record<CastleParameterKey, ParameterBound>> = {
  1: {
    build_cost: { min: 0, max: 20000, step: 1000 },
    maintenance: { min: 0, max: 10000, step: 1000 },
    defense: { min: 0, max: 100000, step: 10000 },
  },
  2: {
    build_cost: { min: 0, max: 50000, step: 1000 },
    maintenance: { min: 0, max: 20000, step: 1000 },
    defense: { min: 0, max: 250000, step: 25000 },
  },
  3: {
    build_cost: { min: 0, max: 100000, step: 1000 },
    maintenance: { min: 0, max: 50000, step: 1000 },
    defense: { min: 0, max: 500000, step: 50000 },
  },
};

export const BLOCK_REWARD_HELP = {
  label: "Block Mining Reward",
  tooltip: "The amount of troops rewarded to the nation that successfully mines a block.",
};

export const CASTLE_PARAMETER_HELP: Record<
  CastleParameterKey,
  { label: string; tooltip: (level: CastleLevel) => string }
> = {
  build_cost: {
    label: "Build Cost",
    tooltip: (level) => `Gold cost required to build a Level ${level} Castle.`,
  },
  maintenance: {
    label: "Monthly Maintenance",
    tooltip: (level) => `Monthly gold cost deducted from the country treasury to support a Level ${level} Castle.`,
  },
  defense: {
    label: "Defense Power",
    tooltip: () => "Additional defense power added to the country's military strength in solver evaluations.",
  },
};

export function getCastleParameterHelp(level: CastleLevel, field: CastleParameterKey) {
  const { label, tooltip } = CASTLE_PARAMETER_HELP[field];
  return {
    label: `L${level} ${label}`,
    tooltip: tooltip(level),
  };
}

export function formatBlockRewardValue(v: number): string {
  if (v === 0) return "0";
  return `${v / 1000}K`;
}

export function formatCastleParameterValue(field: CastleParameterKey, displayValue: number): string {
  if (displayValue === 0) return "0";
  if (field === "build_cost" || field === "maintenance") {
    return `${displayValue}K 💰`;
  }
  return `${displayValue}K`;
}

export function clampBlockReward(raw: number): number {
  const { min, max } = BLOCK_REWARD_BOUNDS;
  if (!Number.isFinite(raw)) {
    return DEFAULT_GAME_PARAMETERS.block_reward;
  }
  return Math.min(max, Math.max(min, raw));
}

export function clampCastleParameter(level: CastleLevel, field: CastleParameterKey, raw: number): number {
  const { min, max } = CASTLE_LEVEL_BOUNDS[level][field];
  if (!Number.isFinite(raw)) {
    return DEFAULT_GAME_PARAMETERS.castles[level][field];
  }
  return Math.min(max, Math.max(min, raw));
}

function mergeCastleLevel(level: CastleLevel, raw?: Partial<CastleParameters> | null): CastleParameters {
  return {
    ...DEFAULT_GAME_PARAMETERS.castles[level],
    ...raw,
  };
}

function normalizeCastles(raw: unknown): Record<CastleLevel, CastleParameters> {
  if (!raw || typeof raw !== "object") {
    return cloneGameParameters(DEFAULT_GAME_PARAMETERS).castles;
  }

  const source = raw as Record<string, Partial<CastleParameters>>;
  const castles = {} as Record<CastleLevel, CastleParameters>;
  for (const level of CASTLE_LEVELS) {
    castles[level] = mergeCastleLevel(level, source[level] ?? source[String(level)]);
  }
  return castles;
}

export function normalizeGameParameters(raw?: Partial<GameParameters> | null): GameParameters {
  if (!raw) {
    return cloneGameParameters(DEFAULT_GAME_PARAMETERS);
  }

  return {
    block_reward: raw.block_reward ?? DEFAULT_GAME_PARAMETERS.block_reward,
    castles: normalizeCastles(raw.castles),
  };
}

function cloneGameParameters(params: GameParameters): GameParameters {
  const castles = {} as Record<CastleLevel, CastleParameters>;
  for (const level of CASTLE_LEVELS) {
    castles[level] = { ...params.castles[level] };
  }
  return {
    block_reward: params.block_reward,
    castles,
  };
}
