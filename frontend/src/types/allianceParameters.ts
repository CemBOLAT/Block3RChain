export interface AllianceParameters {
  ratio_limit: number;
  alpha: number;
  beta: number;
  epsilon_fraction: number;
}

export const DEFAULT_ALLIANCE_PARAMETERS: AllianceParameters = {
  ratio_limit: 1.5,
  alpha: 0.1,
  beta: 1.5,
  epsilon_fraction: 0.05,
};

export type AllianceParameterKey = keyof AllianceParameters;

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
    label: "Alliance Fee Scale",
    tooltip:
      "Scales internal coordination cost inside an alliance. Higher values make large coalitions " +
      "less attractive relative to going solo or staying in a small bloc.",
  },
  beta: {
    label: "Alliance Size Penalty",
    tooltip:
      "Exponent on alliance size in the fee formula. Values above 1 penalize large alliances " +
      "more aggressively as member count grows.",
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
