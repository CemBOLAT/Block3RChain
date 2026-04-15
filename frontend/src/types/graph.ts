export interface GraphNode {
  id: string;
  name: string;
  val: number;
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
