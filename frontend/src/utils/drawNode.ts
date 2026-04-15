import { GraphNode, DrawNodeConfig } from "@/types/graph";

const DEFAULT_FONT_SIZE_BASE = 12;
const MIN_FONT_SIZE = 4;
const NODE_RADIUS_SCALAR = 2;
const DEFAULT_NODE_COLOR = "#3b82f6";
const LABEL_COLOR_LIGHT = "#333";
const LABEL_COLOR_DARK = "#fff";
const TROOP_FONT_SIZE_SCALAR = 0.8;
const MIN_TROOP_FONT_SIZE = 3;
const TROOP_COLOR_LIGHT = "#666";
const TROOP_COLOR_DARK = "#aaa";
const TROOP_Y_OFFSET_SCALAR = 2.2;

export function drawNode(
  node: object,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  config: DrawNodeConfig
) {
  const graphNode = node as GraphNode;
  const label = graphNode.name;
  const troopScore = graphNode.troopScore;
  const fontSize = DEFAULT_FONT_SIZE_BASE / globalScale;
  
  ctx.font = `${Math.max(fontSize, MIN_FONT_SIZE)}px Sans-Serif`;

  // Base circle
  ctx.fillStyle = graphNode.color || DEFAULT_NODE_COLOR;
  ctx.beginPath();
  ctx.arc(
    graphNode.x || 0,
    graphNode.y || 0,
    graphNode.val * NODE_RADIUS_SCALAR,
    0,
    2 * Math.PI,
    false,
  );
  ctx.fill();

  // Label
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = config.mode === "light" ? LABEL_COLOR_LIGHT : LABEL_COLOR_DARK;
  ctx.fillText(
    label,
    graphNode.x || 0,
    (graphNode.y || 0) + graphNode.val * NODE_RADIUS_SCALAR + fontSize,
  );

  // Sub-label for troops
  ctx.font = `${Math.max(fontSize * TROOP_FONT_SIZE_SCALAR, MIN_TROOP_FONT_SIZE)}px Sans-Serif`;
  ctx.fillStyle = config.mode === "light" ? TROOP_COLOR_LIGHT : TROOP_COLOR_DARK;
  ctx.fillText(
    troopScore.toLocaleString(),
    graphNode.x || 0,
    (graphNode.y || 0) + graphNode.val * NODE_RADIUS_SCALAR + fontSize * TROOP_Y_OFFSET_SCALAR,
  );
}
