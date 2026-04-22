import { Marker } from "react-simple-maps";
import { THEME_COLORS } from "@/theme/themeConfig";
import { MapNode } from "@/types/map";
import type { ThemeMode } from "@/types/theme";

export interface CountryNodeProps {
  node: MapNode;
  markerColor: string;
  mode: ThemeMode;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export default function CountryNode({ node, markerColor, mode, onContextMenu }: CountryNodeProps) {
  const { mapColors } = { mapColors: THEME_COLORS[mode].map };

  return (
    <Marker coordinates={node.coordinates}>
      <circle
        r={node.radius}
        fill={markerColor}
        stroke={mode === "dark" ? "#121212" : "#fff"}
        strokeWidth={1.5}
        onContextMenu={onContextMenu}
        style={{
          transition: "r 0.5s ease-in-out",
          cursor: "context-menu",
        }}
      />
      {/* Country Name */}
      <text
        textAnchor="middle"
        y={node.radius + 15}
        style={{
          fontFamily: "system-ui",
          fill: mapColors.nodeText,
          fontSize: "12px",
          fontWeight: 600,
          pointerEvents: "none",
        }}
      >
        {node.name}
      </text>
      {/* Troop Score */}
      <text
        textAnchor="middle"
        y={node.radius + 28}
        style={{
          fontFamily: "system-ui",
          fill: mapColors.nodeTextSecondary,
          fontSize: "10px",
          pointerEvents: "none",
        }}
      >
        {node.troopScore}
      </text>
    </Marker>
  );
}
