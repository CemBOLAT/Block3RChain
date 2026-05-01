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
 * Formats troop counts into 'K' notation (e.g., 25000 -> 25 K)
 */
export const formatTroops = (count: any): string => {
  if (count === null || count === undefined) return "0";
  
  let val = count;
  // Fallback if we accidentally get a nation object
  if (typeof count === 'object' && count !== null) {
    val = count.troops ?? 0;
  }
  
  const num = Number(val);
  if (isNaN(num)) return "0";

  if (num >= 1000) {
    const kValue = num / 1000;
    return `${kValue.toLocaleString("en-US", { maximumFractionDigits: 1 })} K`;
  }
  return num.toLocaleString("en-US");
};

/**
 * Rounds troop counts to the nearest 100 for backend consistency
 */
export const roundTroops = (count: number): number => {
  return Math.round(count / 100) * 100;
};
