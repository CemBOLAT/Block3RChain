export type AllianceStrategy = "balanced" | "random" | "unbalanced";

export interface AllianceParameters {
  ratio_limit: number;
  alpha: number;
  beta: number;
  epsilon_fraction: number;
  strategy: AllianceStrategy;
}

export const DEFAULT_ALLIANCE_PARAMETERS: AllianceParameters = {
  ratio_limit: 1.5,
  alpha: 0.1,
  beta: 1.5,
  epsilon_fraction: 0.05,
  strategy: "balanced",
};

export type AllianceParameterKey = Exclude<keyof AllianceParameters, "strategy">;

export interface AllianceParameterBound {
  min: number;
  max: number;
  step: number;
}

export const ALLIANCE_PARAMETER_BOUNDS: Record<AllianceParameterKey, AllianceParameterBound> = {
  ratio_limit: { min: 1.2, max: 3.0, step: 0.1 },
  alpha: { min: 0.05, max: 0.25, step: 0.01 },
  beta: { min: 1.0, max: 2.5, step: 0.1 },
  epsilon_fraction: { min: 0, max: 0.15, step: 0.01 },
};

export const ALLIANCE_PARAMETER_KEYS = Object.keys(ALLIANCE_PARAMETER_BOUNDS) as AllianceParameterKey[];

export const ALLIANCE_STRATEGY_OPTIONS: { value: AllianceStrategy; label: string }[] = [
  { value: "balanced", label: "Balanced" },
  { value: "random", label: "Random" },
  { value: "unbalanced", label: "Unbalanced" },
];

export const ALLIANCE_STRATEGY_HELP = {
  label: "Alliance Strategy",
  tooltip:
    "Choose how alliances are selected. 'Balanced' finds the most power-balanced blocs. " +
    "'Random' selects any valid stable alliance configuration randomly. " +
    "'Unbalanced' selects the most unbalanced stable configuration.",
};

export function formatAllianceParameterValue(key: AllianceParameterKey, v: number): string {
  if (key === "alpha" || key === "epsilon_fraction") {
    return v.toFixed(2);
  }
  return v.toFixed(1);
}

export const ALLIANCE_PARAMETER_HELP: Record<
  AllianceParameterKey,
  { label: string; tooltip: string }
> = {
  ratio_limit: {
    label: "Power Balance Limit",
    tooltip:
      "Maximum allowed ratio between the strongest and weakest alliance bloc troop totals. " +
      "Lower values enforce stricter balance; partitions above this limit are rejected.",
  },
  alpha: {
    label: "Alliance Cooperation Coeff.",
    tooltip:
      "How expensive it is to run an alliance. Higher values make large coalitions less worthwhile " +
      "— countries will prefer smaller blocs or going solo.",
  },
  beta: {
    label: "Size Penalty Exponent",
    tooltip:
      "How sharply alliance costs grow with each new member. " +
      "At 1.0 costs rise steadily; higher values make every extra member disproportionately expensive.",
  },
  epsilon_fraction: {
    label: "Alliance Switch Tolerance",
    tooltip:
      "Fraction of a country's solo troop power used as a loyalty cushion when it changes " +
      "alliances versus the previous round. Countries that stay in the same bloc have no cushion.",
  },
};

export function clampAllianceParameter(key: AllianceParameterKey, raw: number): number {
  const { min, max } = ALLIANCE_PARAMETER_BOUNDS[key];
  if (!Number.isFinite(raw)) {
    return DEFAULT_ALLIANCE_PARAMETERS[key];
  }
  return Math.min(max, Math.max(min, raw));
}
