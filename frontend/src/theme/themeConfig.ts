import { createTheme } from "@mui/material/styles";
import { ThemeMode } from "@/types/theme";
import CONFIG from "@/config/appConfig";

export const toggleTheme = (currentMode: ThemeMode): ThemeMode => {
  const newMode = currentMode === "dark" ? "light" : "dark";
  if (typeof window !== "undefined") {
    localStorage.setItem(CONFIG.themeStorageKey, newMode);
  }
  return newMode;
};

export const THEME_COLORS = {
  dark: {
    background: "#020617",
    paper: "#0f172a",
    map: {
      bg: "#121212",
      geoFill: "#2d3748",
      geoStroke: "#4a5568",
      geoHover: "#4a5568",
      activeGeo: "#6366f1",
      line: "rgba(255, 255, 255, 0.4)",
      nodeText: "#ffffff",
      nodeTextSecondary: "#ffffff",
    },
  },
  light: {
    background: "#f8fafc",
    paper: "#ffffff",
    map: {
      bg: "#f1f5f9",
      geoFill: "#e2e8f0",
      geoStroke: "#cbd5e1",
      geoHover: "#94a3b8",
      activeGeo: "#4f46e5",
      line: "rgba(0, 0, 0, 0.4)",
      nodeText: "#ffffff",
      nodeTextSecondary: "#f8fafc",
    },
  },
};

export const getAppTheme = (mode: ThemeMode) =>
  createTheme({
    palette: {
      mode,
      background: {
        default: THEME_COLORS[mode].background,
        paper: THEME_COLORS[mode].paper,
      },
    },
    typography: {
      fontFamily: "inherit",
    },
  });
