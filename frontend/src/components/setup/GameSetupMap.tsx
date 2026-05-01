"use client";

import { useMemo, useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { THEME_COLORS } from "@/theme/themeConfig";
import { COUNTRY_COORDS, getMapBounds, getMapZoom, getMapCenter } from "@/utils/mapUtils";
import { ThemeMode } from "@/types/theme";
import { useGameSetupStore } from "@/store/useGameSetupStore";
import CountryMarker from "@/components/map/CountryMarker";
import AddCountryMenu from "./AddCountryMenu";
import ActiveCountryMenu from "./ActiveCountryMenu";
import { NationAddProps } from "@/types/simulation";

const geoUrl = "https://unpkg.com/world-atlas@2/countries-110m.json";

export default function GameSetupMap() {
  const { editableNations, updateNation, removeNation } = useGameSetupStore();
  const theme = useTheme();
  const mode = theme.palette.mode as ThemeMode;

  const { map: mapColors } = THEME_COLORS[mode];
  const { bg: mapBgColor, geoFill, geoStroke, geoHover, activeGeo, nodeText, nodeTextSecondary } = mapColors;

  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    countryName: string;
    isActive: boolean;
  } | null>(null);

  const mapData = useMemo(() => {
    const countryNames = Object.keys(editableNations);
    const countries = countryNames.map((name) => ({
      name,
      coordinates: COUNTRY_COORDS[name]?.center || [0, 0],
      troopScore: editableNations[name] || 0,
    }));

    const bounds = getMapBounds(countryNames);
    const center = bounds ? getMapCenter(bounds) : ([0, 20] as [number, number]);
    const zoom = bounds ? getMapZoom(bounds) : 1;

    return {
      countries,
      center,
      zoom,
    };
  }, [editableNations]);

  const handleContextMenu = (event: React.MouseEvent, countryName: string, isActive: boolean) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      countryName,
      isActive,
    });
  };

  const handleAddCountry = (data: NationAddProps) => {
    updateNation(data.name, {
      troops: data.troops,
      gold: data.gold,
      population: data.population,
    });
    setContextMenu(null);
  };

  return (
    <Box className="grow h-full relative overflow-hidden" style={{ backgroundColor: mapBgColor }}>
      {mapData.countries.length > 0 ? (
        <>
          <ComposableMap projection="geoMercator" projectionConfig={{ scale: 200 }} className="w-full h-full">
            <ZoomableGroup zoom={mapData.zoom} center={mapData.center} minZoom={0.2} maxZoom={8}>
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const countryName = geo.properties.name;
                    const isActive = editableNations[countryName] !== undefined;

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={isActive ? activeGeo : geoFill}
                        stroke={isActive ? "white" : geoStroke}
                        strokeWidth={isActive ? 1 / mapData.zoom : 0.5 / mapData.zoom}
                        onClick={() => {}}
                        onContextMenu={(e) => handleContextMenu(e, countryName, isActive)}
                        style={{
                          default: { outline: "none" },
                          hover: {
                            fill: isActive ? activeGeo : geoHover,
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

          {contextMenu && !contextMenu.isActive && (
            <AddCountryMenu
              key={`add-${contextMenu.countryName}`}
              open={true}
              onClose={() => setContextMenu(null)}
              anchorPosition={{ top: contextMenu.mouseY, left: contextMenu.mouseX }}
              countryName={contextMenu.countryName}
              onAdd={handleAddCountry}
            />
          )}

          {contextMenu && contextMenu.isActive && (
            <ActiveCountryMenu
              key={`active-${contextMenu.countryName}`}
              open={true}
              onClose={() => setContextMenu(null)}
              anchorPosition={{ top: contextMenu.mouseY, left: contextMenu.mouseX }}
              countryName={contextMenu.countryName}
              onRemove={removeNation}
            />
          )}
        </>
      ) : (
        <Box className="flex items-center justify-center h-full text-center">
          <Typography variant="h6" className="text-xl font-semibold opacity-60 px-8">
            Select a simulation template to preview map
          </Typography>
        </Box>
      )}
    </Box>
  );
}
