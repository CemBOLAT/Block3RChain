"use client";

import { useMemo, useState } from "react";
import { useSimulationStore } from "@/store/useSimulationStore";
import { Box, Typography, useTheme } from "@mui/material";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { THEME_COLORS } from "@/theme/themeConfig";
import { COUNTRY_COORDS, getMapCenter, getMapBounds, getMapZoom } from "@/utils/mapUtils";
import { type MapNode, type MapContextMenuState, type GodInterventionType } from "@/types/map";
import { ThemeMode } from "@/types/theme";
import { ALLIANCE_COLORS } from "@/data/allianceColors";
import CountryMarker from "@/components/map/CountryMarker";
import MapContextMenu from "@/components/map/MapContextMenu";

const geoUrl = "https://unpkg.com/world-atlas@2/countries-110m.json";

export default function NetworkMap() {
  const { ledger, alliances, removeCountry, addCountry, triggerGodIntervention } = useSimulationStore();
  const theme = useTheme();
  const mode = theme.palette.mode as ThemeMode;

  const [contextMenu, setContextMenu] = useState<MapContextMenuState | null>(null);

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

  const handleAction = (type: GodInterventionType) => {
    if (!contextMenu) return;
    const name = contextMenu.targetName;

    if (type === "add") triggerGodIntervention(name, 5000);
    else if (type === "remove") triggerGodIntervention(name, -5000);
    else if (type === "delete") removeCountry(name);
    else if (type === "create") addCountry(name, 10000);
  };

  const { map: mapColors } = THEME_COLORS[mode];
  const { bg: mapBgColor, geoFill, geoStroke, geoHover, activeGeo, nodeText, nodeTextSecondary } = mapColors;

  const mapData = useMemo(() => {
    const countryNames = Object.keys(ledger);
    const bounds = getMapBounds(countryNames);
    const center = bounds ? getMapCenter(bounds) : ([0, 20] as [number, number]);
    const zoom = bounds ? getMapZoom(bounds) : 1;

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

    const countries: MapNode[] = countryNames.map((country) => ({
      name: country,
      coordinates: COUNTRY_COORDS[country]?.center || [0, 0],
      troopScore: ledger[country] || 0,
      color: countryColorMap[country] || activeGeo,
    }));

    return { countries, center, zoom, countryColorMap };
  }, [ledger, alliances, activeGeo]);

  return (
    <Box className="grow h-full relative overflow-hidden" style={{ backgroundColor: mapBgColor }}>
      {mapData.countries.length >= 0 ? (
        <ComposableMap projection="geoMercator" projectionConfig={{ scale: 200 }} className="w-full h-full">
          <ZoomableGroup zoom={mapData.zoom} center={mapData.center} minZoom={0.2} maxZoom={8}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const countryName = geo.properties.name;
                  const allianceColor = mapData.countryColorMap[countryName];
                  const isSimMember = ledger[countryName] !== undefined;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={isSimMember ? allianceColor || activeGeo : geoFill}
                      stroke={isSimMember ? "white" : geoStroke}
                      strokeWidth={(isSimMember ? 0.75 : 0.5) / mapData.zoom}
                      onContextMenu={(e) => handleContextMenu(e, countryName)}
                      style={{
                        default: { outline: "none" },
                        hover: {
                          fill: isSimMember ? allianceColor || activeGeo : geoHover,
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

            {mapData.countries.map((country) => (
              <CountryMarker
                key={country.name}
                country={country}
                zoom={mapData.zoom}
                textColor={nodeText}
                secondaryTextColor={nodeTextSecondary}
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
      <MapContextMenu
        contextMenu={contextMenu}
        onClose={() => setContextMenu(null)}
        onAction={handleAction}
      />
    </Box>
  );
}
