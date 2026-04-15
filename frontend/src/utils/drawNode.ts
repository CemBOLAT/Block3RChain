import { GraphNode, DrawNodeConfig } from "@/types/graph";

export function drawNode(
  node: object,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  config: DrawNodeConfig
) {
  const graphNode = node as GraphNode;
  const label = graphNode.name;
  const fontSize = 12 / globalScale;
  ctx.font = `${Math.max(fontSize, 4)}px Sans-Serif`;

  // Base circle
  ctx.fillStyle = graphNode.color || "#3b82f6";
  ctx.beginPath();
  ctx.arc(
    graphNode.x || 0,
    graphNode.y || 0,
    graphNode.val * 2,
    0,
    2 * Math.PI,
    false,
  );
  ctx.fill();

  // Label
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  ctx.fillText(
    label,
    graphNode.x || 0,
    (graphNode.y || 0) + graphNode.val * 2 + fontSize,
  );

  // Sub-label for troops
  ctx.font = `${Math.max(fontSize * 0.8, 3)}px Sans-Serif`;
  ctx.fillStyle = "#aaa";
  ctx.fillText(
    config.troopScore.toLocaleString(),
    graphNode.x || 0,
    (graphNode.y || 0) + graphNode.val * 2 + fontSize * 2.2,
  );
}
