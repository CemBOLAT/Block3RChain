"use client";

import { useMemo, useState } from "react";
import { useSimulationStore } from "@/store/useSimulationStore";
import { Box, Typography, useTheme } from "@mui/material";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { THEME_COLORS } from "@/theme/themeConfig";
import { COUNTRY_COORDS, getMapCenter, getMapBounds, getMapZoom } from "@/utils/mapUtils";
import { type MapNode, type MapContextMenuState, type GodInterventionType } from "@/types/map";
import { ThemeMode } from "@/types/theme";
import CountryMarker from "@/components/map/CountryMarker";
import MapContextMenu from "@/components/map/MapContextMenu";
import AddCountryMenu from "@/components/map/AddCountryMenu";
import { NationAddProps } from "@/types/simulation";
import { ALLIANCE_COLORS } from "@/data/allianceColors";

const geoUrl = "https://unpkg.com/world-atlas@2/countries-110m.json";

export default function NetworkMap() {
  const { ledger, alliances, removeCountry, addCountry, triggerGodIntervention, pendingInterventions } =
    useSimulationStore();
  const theme = useTheme();
  const mode = theme.palette.mode as ThemeMode;

  const [contextMenu, setContextMenu] = useState<MapContextMenuState | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [pendingCountry, setPendingCountry] = useState<{ name: string; pos: { top: number; left: number } } | null>(
    null,
  );

  const handleContextMenu = (event: React.MouseEvent, countryName: string) => {
    event.preventDefault();
    event.stopPropagation();

    const isMember = Object.keys(ledger).includes(countryName);

    if (!isMember) {
      if (COUNTRY_COORDS[countryName]) {
        setPendingCountry({ name: countryName, pos: { top: event.clientY, left: event.clientX } });
        setAddMenuOpen(true);
        setContextMenu(null);
      }
      return;
    }

    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      targetName: countryName,
      isSimulationMember: true,
    });
  };

  const handleAction = (type: GodInterventionType) => {
    if (!contextMenu) return;
    const name = contextMenu.targetName;

    if (type === "add") triggerGodIntervention(name, { troopChange: 5000 });
    else if (type === "remove") triggerGodIntervention(name, { troopChange: -5000 });
    else if (type === "gold_add") triggerGodIntervention(name, { goldChange: 10000 });
    else if (type === "gold_remove") triggerGodIntervention(name, { goldChange: -10000 });
    else if (type === "pop_add") triggerGodIntervention(name, { popChange: 5 });
    else if (type === "pop_remove") triggerGodIntervention(name, { popChange: -5 });
    else if (type === "delete") removeCountry(name);
  };

  const handleConfirmAdd = (data: NationAddProps) => {
    addCountry(data.name, data.troops, data.gold, data.population);
    setAddMenuOpen(false);
    setPendingCountry(null);
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
      if (parts.length >= 2) {
        for (let i = 0; i < parts.length; i++) {
          for (let j = i + 1; j < parts.length; j++) {
            if (!allianceGraph[parts[i]]) allianceGraph[parts[i]] = [];
            if (!allianceGraph[parts[j]]) allianceGraph[parts[j]] = [];
            allianceGraph[parts[i]].push(parts[j]);
            allianceGraph[parts[j]].push(parts[i]);
          }
        }
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

  const getPendingStatus = (countryName: string) => {
    const p = pendingInterventions.find((i) => i.target === countryName);
    if (!p) return null;
    return p.type;
  };

  return (
    <Box className="grow h-full relative overflow-hidden" style={{ backgroundColor: mapBgColor }}>
      {mapData.countries.length >= 0 ? (
        <ComposableMap projection="geoMercator" projectionConfig={{ scale: 200 }} className="w-full h-full">
          <defs>
            <radialGradient id="pendingInterventionGradient">
              <stop offset="0%" stopColor="#fb923c" stopOpacity="0.4" />
              <stop offset="85%" stopColor="#f97316" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ea580c" stopOpacity="1" />
            </radialGradient>
            <linearGradient id="pendingAddGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ade80" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#22c55e" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#16a34a" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="pendingRemoveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f87171" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#ef4444" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="1" />
            </linearGradient>

            {/* Pulsing animation for interventions - increased region to prevent clipping */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <ZoomableGroup zoom={mapData.zoom} center={mapData.center} minZoom={0.2} maxZoom={8}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const countryName = geo.properties.name;
                  const allianceColor = mapData.countryColorMap[countryName];
                  const isSimMember = ledger[countryName] !== undefined;
                  const pendingStatus = getPendingStatus(countryName);

                  let fill = isSimMember ? allianceColor || activeGeo : geoFill;
                  let stroke = isSimMember ? "white" : geoStroke;
                  let strokeWidth = (isSimMember ? 0.75 : 0.5) / mapData.zoom;

                  if (pendingStatus === "GOD_INTERVENTION") {
                    fill = "url(#pendingInterventionGradient)";
                    stroke = "#fb923c";
                    strokeWidth = 2 / mapData.zoom;
                  } else if (pendingStatus === "COUNTRY_ADD") {
                    fill = "url(#pendingAddGradient)";
                    stroke = "#4ade80";
                    strokeWidth = 2 / mapData.zoom;
                  } else if (pendingStatus === "COUNTRY_REMOVE") {
                    fill = "url(#pendingRemoveGradient)";
                    stroke = "#f87171";
                    strokeWidth = 2 / mapData.zoom;
                  }

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      onContextMenu={(e) => handleContextMenu(e, countryName)}
                      style={{
                        default: {
                          outline: "none",
                          filter: pendingStatus ? "url(#glow)" : "none",
                        },
                        hover: {
                          fill: pendingStatus ? fill : isSimMember ? allianceColor || activeGeo : geoHover,
                          filter: "brightness(1.2) url(#glow)",
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
      <MapContextMenu contextMenu={contextMenu} onClose={() => setContextMenu(null)} onAction={handleAction} />

      {pendingCountry && (
        <AddCountryMenu
          key={pendingCountry.name}
          open={addMenuOpen}
          onClose={() => {
            setAddMenuOpen(false);
            setPendingCountry(null);
          }}
          anchorPosition={pendingCountry.pos}
          countryName={pendingCountry.name}
          onAdd={handleConfirmAdd}
        />
      )}
    </Box>
  );
}
