"use client";

import { useMemo } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from "react-simple-maps";
import CountryNode from "../map/CountryNode";
import { THEME_COLORS } from "@/theme/themeConfig";
import { COUNTRY_COORDS, calculateNodeRadius, getMapCenter } from "@/utils/mapUtils";
import { MapNode } from "@/types/map";
import { ThemeMode } from "@/types/theme";

const geoUrl = "https://unpkg.com/world-atlas@2/countries-110m.json";

interface GameSetupMapProps {
  nations: Record<string, number>;
  onCountryClick?: (countryName: string) => void;
}

export default function GameSetupMap({ nations, onCountryClick }: GameSetupMapProps) {
  const theme = useTheme();
  const mode = theme.palette.mode as ThemeMode;

  const { map: mapColors } = THEME_COLORS[mode];
  const { bg: mapBgColor, geoFill: geoFillColor, geoStroke: geoStrokeColor, geoHover: geoHoverColor } = mapColors;
  const markerColor = theme.palette.primary.main;

  const mapData = useMemo(() => {
    const countryNames = Object.keys(nations);
    const simulationMemberColor = theme.palette.primary.dark;

    const nodes: MapNode[] = countryNames.map((country) => ({
      id: country,
      name: country,
      coordinates: COUNTRY_COORDS[country] || [0, 0],
      radius: calculateNodeRadius(nations[country] || 0),
      troopScore: nations[country] || 0,
      color: simulationMemberColor,
    }));
    const center = getMapCenter(countryNames);

    // For fast lookup in the Geography loop
    const nodeLookup = new Map(nodes.map((n) => [n.id, n]));

    return { nodes, center, nodeLookup };
  }, [nations, theme.palette.primary.dark]);

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
        {mapData.nodes.length > 0 ? (
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
                    const isActive = !!countryNode;

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={countryNode ? countryNode.color : geoFillColor}
                        stroke={isActive ? "white" : geoStrokeColor}
                        strokeWidth={isActive ? 0.75 : 0.5}
                        onClick={() => onCountryClick?.(geo.properties.name)}
                        style={{
                          default: { outline: "none" },
                          hover: {
                            fill: isActive ? countryNode?.color : geoHoverColor,
                            filter: "brightness(1.2)",
                            outline: "none",
                            cursor: "pointer",
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
            <Typography variant="h6" sx={{ opacity: 0.6 }}>
              Select a simulation template to preview map
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
