import { CountryData } from "@/types/map";

import countryCoordsData from "@/data/country_coords.json";

export const COUNTRY_COORDS: Record<string, CountryData> = countryCoordsData as unknown as Record<string, CountryData>;

export function getMapCenter(bounds: [number, number, number, number]): [number, number] {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
}

export function getMapBounds(countries: string[]): [number, number, number, number] | null {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  let hasValid = false;

  countries.forEach((country) => {
    const data = COUNTRY_COORDS[country];
    if (data?.boundingBox) {
      const [cMinLng, cMinLat, cMaxLng, cMaxLat] = data.boundingBox;
      minLng = Math.min(minLng, cMinLng);
      minLat = Math.min(minLat, cMinLat);
      maxLng = Math.max(maxLng, cMaxLng);
      maxLat = Math.max(maxLat, cMaxLat);
      hasValid = true;
    } else if (data?.center) {
      const [lng, lat] = data.center;
      minLng = Math.min(minLng, lng - 2);
      minLat = Math.min(minLat, lat - 2);
      maxLng = Math.max(maxLng, lng + 2);
      maxLat = Math.max(maxLat, lat + 2);
      hasValid = true;
    }
  });

  return hasValid ? [minLng, minLat, maxLng, maxLat] : null;
}

export function getMapZoom(bounds: [number, number, number, number]): number {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  const lngDiff = Math.max(maxLng - minLng, 30);
  const latDiff = Math.max(maxLat - minLat, 20);

  const zoomX = 200 / lngDiff;
  const zoomY = 100 / latDiff;

  const zoom = Math.min(zoomX, zoomY) * 0.95;
  return Math.min(Math.max(zoom, 0.5), 4);
}
