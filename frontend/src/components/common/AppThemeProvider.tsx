"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import { getAppTheme, toggleTheme } from "@/theme/themeConfig";
import { ThemeMode } from "@/types/theme";
import CONFIG from "@/config/appConfig";
import ThemeToggle from "./ThemeToggle";

interface ThemeContextType {
  mode: ThemeMode;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useAppTheme must be used within AppThemeProvider");
  return context;
};

export default function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

  const theme = useMemo(() => getAppTheme(mode), [mode]);

  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem(CONFIG.themeStorageKey) as ThemeMode;
    if (savedMode === "light" || savedMode === "dark") {
      setMode(savedMode);
    }
  }, []);

  const handleToggleMode = () => {
    setMode((prev) => toggleTheme(prev));
  };

  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={{ mode, toggleMode: handleToggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ position: "fixed", top: 24, right: 24, zIndex: 9999 }}>
          <ThemeToggle mode={mode} toggleMode={handleToggleMode} />
        </Box>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
