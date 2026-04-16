import { Point } from "@/types/map";

export const COUNTRY_COORDS: Record<string, Point> = {
  Türkiye: [35.2433, 38.9637],
  Yunanistan: [21.8243, 39.0742],
  Bulgaristan: [25.4858, 42.7339],
  Sırbistan: [20.4489, 44.7866],
  Romanya: [24.9668, 45.9432],
  Macaristan: [19.5033, 47.1625],
};

export function calculateNodeRadius(troopScore: number): number {
  return Math.max(3, Math.sqrt(troopScore || 1000) / 10);
}

export function getMapCenter(countries: string[]): Point {
  let sumLng = 0;
  let sumLat = 0;
  let validCount = 0;

  countries.forEach((country) => {
    const coordinates = COUNTRY_COORDS[country];
    if (coordinates) {
      sumLng += coordinates[0];
      sumLat += coordinates[1];
      validCount++;
    }
  });

  if (validCount === 0) return [0, 0];

  return [sumLng / validCount, sumLat / validCount];
}
