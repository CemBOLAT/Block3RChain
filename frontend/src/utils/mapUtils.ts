import { Point } from '@/types/map';

import countryCoordsData from '@/data/country_coords.json';

export const COUNTRY_COORDS: Record<string, Point> = countryCoordsData as unknown as Record<string, Point>;

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
