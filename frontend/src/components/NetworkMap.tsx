"use client";

import { useMemo } from "react";
import { useSimulationStore } from "@/store/useSimulationStore";
import { Box, Typography, useTheme, Tooltip } from "@mui/material";
import { ComposableMap, Geographies, Geography, Marker, Line, ZoomableGroup } from "react-simple-maps";
import CountryNode from "./CountryNode";
import { THEME_COLORS } from "@/theme/themeConfig";
import { COUNTRY_COORDS, calculateNodeRadius, getMapCenter } from "@/utils/mapUtils";
import { MapNode, MapLink, type Point } from "@/types/map";

const geoUrl = "https://unpkg.com/world-atlas@2/countries-110m.json";

export default function NetworkMap() {
  const { ledger, alliances } = useSimulationStore();
  const theme = useTheme();
  const mode = theme.palette.mode as "light" | "dark";

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
        {mapData.nodes.length > 0 ? (
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 800,
            }}
            style={{ width: "100%", height: "100%" }}
          >
            <ZoomableGroup zoom={1} center={mapData.center} minZoom={0.5} maxZoom={5}>
              {/* World Map Boundaries */}
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={geoFillColor}
                      stroke={geoStrokeColor}
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: {
                          fill: geoHoverColor,
                          outline: "none",
                        },
                        pressed: { outline: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>

              {/* Alliance Connection Lines */}
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

              {/* Country Nodes (Points) */}
              {mapData.nodes.map((node) => (
                <CountryNode key={node.id} node={node} markerColor={markerColor} mode={mode} />
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
    </Box>
  );
}
