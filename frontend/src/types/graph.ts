export interface GraphNode {
  id: string;
  name: string;
  val: number;
  troopScore: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  color?: string;
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
}

export interface DrawNodeConfig {
  mode: "light" | "dark";
  // For future visual configurations (e.g., isHighlighted?: boolean; etc.)
}
