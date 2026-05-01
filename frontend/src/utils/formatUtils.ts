/**
 * Formats a date string or number into a readable DD/MM HH:mm format
 */
export const formatDateTime = (timestamp: string | number | Date): string => {
  const date = new Date(timestamp);
  
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(",", "");
};

/**
 * Formats troop or gold counts into 'K' notation (e.g., 25000 -> 25K)
 * If the value is less than 1000 but should be treated as K-scale, 
 * we still show it with K if it represents units of thousands.
 */
export const formatResource = (count: any, suffix: string = "K"): string => {
  if (count === null || count === undefined) return `0${suffix}`;
  
  let val = count;
  if (typeof count === 'object' && count !== null) {
    val = count.troops ?? count.gold ?? 0;
  }
  
  const num = Number(val);
  if (isNaN(num)) return `0${suffix}`;

  const kValue = num / 1000;
  // Use toLocaleString for pretty numbers, max 1 decimal place
  return `${kValue.toLocaleString("en-US", { maximumFractionDigits: 1 })}${suffix}`;
};

/**
 * Formats troop counts into 'K' notation
 */
export const formatTroops = (count: any): string => {
  return formatResource(count, "K");
};

/**
 * Formats gold counts into 'K' notation
 */
export const formatGold = (count: any): string => {
  return formatResource(count, "K");
};

/**
 * Converts frontend user input (in K) to backend units (actual numbers)
 * Example: 5 -> 5000
 */
export const toBackendUnits = (value: number): number => {
  return value * 1000;
};

/**
 * Converts backend units to frontend display units
 * Example: 5000 -> 5
 */
export const fromBackendUnits = (value: number): number => {
  return value / 1000;
};

/**
 * Rounds troop counts to the nearest 1000 for backend consistency
 */
export const roundTroops = (count: number): number => {
  return Math.round(count / 1000) * 1000;
};
