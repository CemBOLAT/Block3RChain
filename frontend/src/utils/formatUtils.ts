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
