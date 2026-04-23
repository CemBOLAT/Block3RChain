"use client";

import { useMemo } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import CountryNode from "./CountryNode";
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
  const {
    bg: mapBgColor,
    geoFill: geoFillColor,
    geoStroke: geoStrokeColor,
    geoHover: geoHoverColor,
  } = mapColors;
  const markerColor = theme.palette.primary.main;

  const mapData = useMemo(() => {
    const countryNames = Object.keys(nations);

    const nodes: MapNode[] = countryNames.map((country) => ({
      id: country,
      name: country,
      coordinates: COUNTRY_COORDS[country] || [0, 0],
      radius: calculateNodeRadius(nations[country] || 0),
      troopScore: nations[country] || 0,
    }));
    const center = getMapCenter(countryNames);

    return { nodes, center };
  }, [nations]);

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
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={geoFillColor}
                      stroke={geoStrokeColor}
                      strokeWidth={0.5}
                      onClick={() => onCountryClick?.(geo.properties.name)}
                      style={{
                        default: { outline: "none" },
                        hover: {
                          fill: geoHoverColor,
                          outline: "none",
                          cursor: onCountryClick ? "pointer" : "default",
                        },
                        pressed: { outline: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>

              {mapData.nodes.map((node) => (
                <CountryNode 
                  key={node.id} 
                  node={node} 
                  markerColor={markerColor} 
                  mode={mode} 
                  onClick={() => onCountryClick?.(node.name)}
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
            <Typography variant="h6" sx={{ opacity: 0.6 }}>
              Select a simulation template to preview map
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
