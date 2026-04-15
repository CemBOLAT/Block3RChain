"use client";

import { useMemo } from "react";
import { useSimulationStore } from "@/store/useSimulationStore";
import { Box, Typography, useTheme } from "@mui/material";
import ForceGraph2D from "react-force-graph-2d";
import { GraphNode, GraphLink } from "@/types/graph";
import { drawNode } from "@/utils/drawNode";

export default function NetworkMap() {
  const { ledger, alliances } = useSimulationStore();
  const theme = useTheme();
  const mode = theme.palette.mode as "light" | "dark";

  const drawConfig = useMemo(() => ({ mode }), [mode]);

  const graphData = useMemo(() => {
    const nodes: GraphNode[] = Object.keys(ledger).map((country) => ({
      id: country,
      name: country,
      val: Math.max(2, Math.sqrt(ledger[country] || 1000) / 10),
      troopScore: ledger[country] || 0,
    }));

    const links: GraphLink[] = alliances
      .map((allianceStr) => {
        const parts = allianceStr.split(" <-> ");
        if (parts.length === 2) {
          return {
            id: `${parts[0]}-${parts[1]}`,
            source: parts[0],
            target: parts[1],
          };
        }
        return null;
      })
      .filter(Boolean) as GraphLink[];

    return { nodes, links };
  }, [ledger, alliances]);

  return (
    <Box
      sx={{
        flexGrow: 1,
        height: "100%",
        position: "relative",
        bgcolor: "background.paper",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
        {graphData.nodes.length > 0 ? (
          <ForceGraph2D
            graphData={graphData}
            nodeAutoColorBy="id"
            nodeRelSize={6}
            minZoom={1.5}
            maxZoom={10}
            d3AlphaDecay={0.01}
            d3VelocityDecay={0.4}
            d3AlphaMin={0.05}
            linkColor={() =>
              mode === "light" ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.4)"
            }
            linkWidth={2}
            nodeCanvasObject={(node: any, ctx, globalScale) =>
              drawNode(node, ctx, globalScale, drawConfig)
            }
          />
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "text.secondary",
            }}
          >
            <Typography>Waiting for simulation data...</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
