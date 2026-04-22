"use client";

import { useMemo, useState } from "react";
import { useSimulationStore } from "@/store/useSimulationStore";
import { Box, Typography, useTheme, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from "@mui/material";
import { ComposableMap, Geographies, Geography, ZoomableGroup, Line } from "react-simple-maps";
import CountryNode from "./CountryNode";
import { THEME_COLORS } from "@/theme/themeConfig";
import { COUNTRY_COORDS, calculateNodeRadius, getMapCenter } from "@/utils/mapUtils";
import { MapNode, MapLink, type Point } from "@/types/map";
import { Sword, Zap, Globe, Trash2, PlusCircle } from "lucide-react";
import { ThemeMode } from "@/types/theme";

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
    
    // Check if country exists in simulation ledger
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

    const nodes: MapNode[] = countryNames.map((country) => ({
      id: country,
      name: country,
      coordinates: COUNTRY_COORDS[country] || [0, 0],
      radius: calculateNodeRadius(ledger[country] || 0),
      troopScore: ledger[country] || 0,
    }));
    const center = getMapCenter(countryNames);

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
            };
          }
        }
        return null;
      })
      .filter((link): link is MapLink => link !== null);

    return { nodes, links, center };
  }, [ledger, alliances]);

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
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={geoFillColor}
                      stroke={geoStrokeColor}
                      strokeWidth={0.5}
                      onContextMenu={(e) => handleContextMenu(e, geo.properties.name)}
                      style={{
                        default: { outline: "none" },
                        hover: {
                          fill: geoHoverColor,
                          outline: "none",
                          cursor: "context-menu"
                        },
                        pressed: { outline: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>

              {mapData.links.map((link) => (
                <Line
                  key={link.id}
                  from={link.coordinates[0]}
                  to={link.coordinates[1]}
                  stroke={lineColor}
                  strokeWidth={2}
                  strokeLinecap="round"
                  className="animated-line"
                />
              ))}

              {mapData.nodes.map((node) => (
                <CountryNode 
                  key={node.id} 
                  node={node} 
                  markerColor={markerColor} 
                  mode={mode} 
                  onContextMenu={(e) => handleContextMenu(e, node.id)}
                />
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
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        slotProps={{
          paper: {
            sx: { width: 220, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }
          }
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="overline" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {contextMenu?.targetName}
          </Typography>
        </Box>
        <Divider />
        
        {contextMenu?.isSimulationMember ? (
          <>
            <MenuItem onClick={() => handleAction("add")}>
              <ListItemIcon><Zap size={18} color="#facc15" /></ListItemIcon>
              <ListItemText primary="Bless (+5,000 Troops)" />
            </MenuItem>
            <MenuItem onClick={() => handleAction("remove")}>
              <ListItemIcon><Sword size={18} color="#f87171" /></ListItemIcon>
              <ListItemText primary="Smite (-5,000 Troops)" />
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => handleAction("delete")} sx={{ color: 'error.main' }}>
              <ListItemIcon><Trash2 size={18} color="#ef4444" /></ListItemIcon>
              <ListItemText primary="Remove Nation" />
            </MenuItem>
          </>
        ) : (
          <MenuItem 
            disabled={!COUNTRY_COORDS[contextMenu?.targetName || ""]} 
            onClick={() => handleAction("create")}
          >
            <ListItemIcon><PlusCircle size={18} color="#4ade80" /></ListItemIcon>
            <ListItemText primary="Add to Simulation" />
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
