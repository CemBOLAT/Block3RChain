import { createTheme } from "@mui/material/styles";

export const THEME_COLORS = {
  dark: {
    background: "#020617",
    paper: "#0f172a",
    map: {
      bg: "#121212",
      geoFill: "#2d3748",
      geoStroke: "#4a5568",
      geoHover: "#4a5568",
      line: "rgba(255, 255, 255, 0.4)",
      nodeText: "#e2e8f0",
      nodeTextSecondary: "#94a3b8",
    },
  },
  light: {
    background: "#f8fafc",
    paper: "#ffffff",
    map: {
      bg: "#f8fafc",
      geoFill: "#cbd5e1",
      geoStroke: "#94a3b8",
      geoHover: "#94a3b8",
      line: "rgba(0, 0, 0, 0.4)",
      nodeText: "#1e293b",
      nodeTextSecondary: "#64748b",
    },
  },
};

export const getAppTheme = (mode: "light" | "dark") =>
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
