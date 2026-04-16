export type Point = [number, number];

export interface MapNode {
  id: string;
  name: string;
  coordinates: Point;
  radius: number;
  troopScore: number;
}

export interface MapLink {
  id: string;
  source: string;
  target: string;
  coordinates: [Point, Point];
}
