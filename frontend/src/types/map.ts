export type Point = [number, number];
export type BoundingBox = [number, number, number, number];

export interface CountryData {
  center: Point;
  boundingBox: BoundingBox | null;
}

export interface MapNode {
  name: string;
  coordinates: Point;
  troopScore: number;
  color?: string;
}

export type GodInterventionType = "add" | "remove" | "delete" | "create" | "gold_add" | "gold_remove" | "pop_add" | "pop_remove";

export interface MapContextMenuState {
  mouseX: number;
  mouseY: number;
  targetName: string;
  isSimulationMember: boolean;
}
