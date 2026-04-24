"use client";

import { useMemo, useState } from "react";
import { useSimulationStore } from "@/store/useSimulationStore";
import { Box, Typography, useTheme, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from "@mui/material";
import { ComposableMap, Geographies, Geography, ZoomableGroup, Line, Marker } from "react-simple-maps";
import CountryNode from "../map/CountryNode";
import { THEME_COLORS } from "@/theme/themeConfig";
import { COUNTRY_COORDS, calculateNodeRadius, getMapCenter } from "@/utils/mapUtils";
import { MapNode, MapLink, type Point } from "@/types/map";
import { Sword, Zap, Globe, Trash2, PlusCircle } from "lucide-react";
import { ThemeMode } from "@/types/theme";
import { ALLIANCE_COLORS } from "@/data/allianceColors";

const geoUrl = "https://unpkg.com/world-atlas@2/countries-110m.json";

export default function NetworkMap() {
  const { ledger, alliances, removeCountry, addCountry, triggerGodIntervention } = useSimulationStore();
  const theme = useTheme();
  const mode = theme.palette.mode as ThemeMode;

  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    targetName: string;
    isSimulationMember: boolean;
  } | null>(null);

  const handleContextMenu = (event: React.MouseEvent, countryName: string) => {
    event.preventDefault();
    event.stopPropagation();

    const isMember = Object.keys(ledger).includes(countryName);

    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
            targetName: countryName,
            isSimulationMember: isMember,
          }
        : null,
    );
  };

  const handleClose = () => setContextMenu(null);

  const handleAction = (type: "add" | "remove" | "delete" | "create") => {
    if (!contextMenu) return;
    const name = contextMenu.targetName;

    if (type === "add") triggerGodIntervention(name, 5000);
    else if (type === "remove") triggerGodIntervention(name, -5000);
    else if (type === "delete") removeCountry(name);
    else if (type === "create") addCountry(name, 10000);

    handleClose();
  };

  const { map: mapColors } = THEME_COLORS[mode];
  const {
    bg: mapBgColor,
    geoFill: geoFillColor,
    geoStroke: geoStrokeColor,
    geoHover: geoHoverColor,
    line: lineColor,
  } = mapColors;
  const markerColor = theme.palette.primary.main;



  const mapData = useMemo(() => {
    const countryNames = Object.keys(ledger);
    const center = getMapCenter(countryNames);

    const allianceGraph: Record<string, string[]> = {};
    countryNames.forEach((c) => (allianceGraph[c] = []));

    alliances.forEach((allianceStr) => {
      const parts = allianceStr.split(" <-> ");
      if (parts.length === 2) {
        if (!allianceGraph[parts[0]]) allianceGraph[parts[0]] = [];
        if (!allianceGraph[parts[1]]) allianceGraph[parts[1]] = [];
        allianceGraph[parts[0]].push(parts[1]);
        allianceGraph[parts[1]].push(parts[0]);
      }
    });

    const countryColorMap: Record<string, string> = {};
    const visited = new Set<string>();
    let colorIndex = 0;

    countryNames.forEach((country) => {
      if (!visited.has(country)) {
        const component: string[] = [];
        const queue = [country];
        visited.add(country);

        while (queue.length > 0) {
          const curr = queue.shift()!;
          component.push(curr);

          allianceGraph[curr]?.forEach((neighbor) => {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          });
        }

        // Only assign special colors to groups with alliances
        if (component.length > 1) {
          const color = ALLIANCE_COLORS[colorIndex % ALLIANCE_COLORS.length];
          component.forEach((c) => (countryColorMap[c] = color));
          colorIndex++;
        }
      }
    });

    const simulationMemberColor = theme.palette.primary.dark;

    const nodes: MapNode[] = countryNames.map((country) => ({
      id: country,
      name: country,
      coordinates: COUNTRY_COORDS[country] || [0, 0],
      radius: calculateNodeRadius(ledger[country] || 0),
      troopScore: ledger[country] || 0,
      color: countryColorMap[country] || simulationMemberColor,
    }));

    // For fast lookup in the Geography loop
    const nodeLookup = new Map(nodes.map((n) => [n.id, n]));

    const links: MapLink[] = alliances
      .map((allianceStr) => {
        const parts = allianceStr.split(" <-> ");
        if (parts.length === 2) {
          const sourceCoords = COUNTRY_COORDS[parts[0]];
          const targetCoords = COUNTRY_COORDS[parts[1]];

          if (sourceCoords && targetCoords) {
            return {
              id: `${parts[0]}-${parts[1]}`,
              source: parts[0],
              target: parts[1],
              coordinates: [sourceCoords, targetCoords] as [Point, Point],
              color: countryColorMap[parts[0]],
            };
          }
        }
        return null;
      })
      .filter((link): link is MapLink => link !== null);

    return { nodes, links, center, nodeLookup };
  }, [ledger, alliances, theme.palette.primary.dark]);

  return (
    <Box
      sx={{
        flexGrow: 1,
        height: "100%",
        position: "relative",
        bgcolor: mapBgColor,
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
        {mapData.nodes.length >= 0 ? (
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 800,
            }}
            style={{ width: "100%", height: "100%" }}
          >
            <ZoomableGroup zoom={1} center={mapData.center} minZoom={0.5} maxZoom={5}>
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const countryNode = mapData.nodeLookup.get(geo.properties.name);
                    const isSimMember = !!countryNode;

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={countryNode ? countryNode.color : geoFillColor}
                        stroke={isSimMember ? "white" : geoStrokeColor}
                        strokeWidth={isSimMember ? 0.75 : 0.5}
                        onContextMenu={(e) => handleContextMenu(e, geo.properties.name)}
                        style={{
                          default: { outline: "none" },
                          hover: {
                            fill: isSimMember ? countryNode?.color : geoHoverColor,
                            filter: "brightness(1.2)",
                            outline: "none",
                            cursor: "context-menu",
                          },
                          pressed: { outline: "none" },
                        }}
                      />
                    );
                  })
                }
              </Geographies>

              {mapData.nodes.map((node) => (
                <Marker key={node.id} coordinates={node.coordinates}>
                  <text
                    textAnchor="middle"
                    y={-10}
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fill: THEME_COLORS[mode].map.nodeText,
                      fontSize: 10,
                      fontWeight: "bold",
                      pointerEvents: "none",
                      textShadow: "0px 0px 4px rgba(0,0,0,0.5)",
                    }}
                  >
                    {node.name}
                  </text>
                  <text
                    textAnchor="middle"
                    y={5}
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fill: THEME_COLORS[mode].map.nodeTextSecondary,
                      fontSize: 8,
                      pointerEvents: "none",
                      textShadow: "0px 0px 4px rgba(0,0,0,0.5)",
                    }}
                  >
                    {node.troopScore.toLocaleString()}
                  </text>
                </Marker>
              ))}
            </ZoomableGroup>
          </ComposableMap>
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

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
        slotProps={{
          paper: {
            sx: { width: 220, bgcolor: "background.paper", border: "1px solid", borderColor: "divider" },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="overline" sx={{ fontWeight: "bold", color: "primary.main" }}>
            {contextMenu?.targetName}
          </Typography>
        </Box>
        <Divider />

        {contextMenu?.isSimulationMember ? (
          <>
            <MenuItem onClick={() => handleAction("add")}>
              <ListItemIcon>
                <Zap size={18} color="#facc15" />
              </ListItemIcon>
              <ListItemText primary="Bless (+5,000 Troops)" />
            </MenuItem>
            <MenuItem onClick={() => handleAction("remove")}>
              <ListItemIcon>
                <Sword size={18} color="#f87171" />
              </ListItemIcon>
              <ListItemText primary="Smite (-5,000 Troops)" />
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => handleAction("delete")} sx={{ color: "error.main" }}>
              <ListItemIcon>
                <Trash2 size={18} color="#ef4444" />
              </ListItemIcon>
              <ListItemText primary="Remove Nation" />
            </MenuItem>
          </>
        ) : (
          <MenuItem disabled={!COUNTRY_COORDS[contextMenu?.targetName || ""]} onClick={() => handleAction("create")}>
            <ListItemIcon>
              <PlusCircle size={18} color="#4ade80" />
            </ListItemIcon>
            <ListItemText primary="Add to Simulation" />
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
