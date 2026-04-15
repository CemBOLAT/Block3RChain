"use client";

import { useEffect, useState, useMemo } from "react";
import { useSimulationStore } from "@/store/useSimulationStore";
import GodModePanel from "@/components/GodModePanel";
import ThemeToggle from "@/components/ThemeToggle";
import dynamic from "next/dynamic";
import { GitBranch } from "lucide-react";
import { getAppTheme } from "@/theme/themeConfig";

// Import graph dynamically avoiding SSR window errors
const NetworkMap = dynamic(() => import("@/components/NetworkMap"), {
  ssr: false,
});

import {
  ThemeProvider,
  CssBaseline,
  Box,
  Paper,
  Typography,
} from "@mui/material";

export default function Home() {
  const { step, fetchState, mempool, connectWebSocket } = useSimulationStore();
  const [mode, setMode] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem("block3rchain_theme");
    if (savedMode === "light" || savedMode === "dark") {
      setMode(savedMode);
    }
  }, []);

  const handleToggleMode = () => {
    const newMode = mode === "dark" ? "light" : "dark";
    setMode(newMode);
    localStorage.setItem("block3rchain_theme", newMode);
  };

  const theme = useMemo(() => getAppTheme(mode), [mode]);

  useEffect(() => {
    // Fetch initial state, then connect to WebSocket instead of Polling
    fetchState();
    connectWebSocket();
  }, [fetchState, connectWebSocket]);

  if (!mounted) return null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          gap: 4,
          p: 4,
          overflow: "hidden",
        }}
      >
        {/* Left Sidebar: God Mode Controls */}
        <Box
          sx={{
            width: 450,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 3,
            flexShrink: 0,
          }}
        >
          {/* App Title & Theme Switch */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: 1,
            }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, letterSpacing: -0.5 }}
            >
              Block3RChain
            </Typography>
            <ThemeToggle
              mode={mode}
              toggleMode={handleToggleMode}
            />
          </Box>

          <GodModePanel />

          {/* Pipeline Info */}
          <Paper
            elevation={6}
            sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <GitBranch size={20} /> Pipeline
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  bgcolor: step === 0 ? "success.dark" : "warning.dark",
                  color: step === 0 ? "success.light" : "warning.light",
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontFamily: "monospace",
                  fontWeight: "bold",
                }}
              >
                {step === 0 ? "EQUILIBRIUM" : `STEP ${step}/15`}
              </Typography>
            </Box>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: mode === "dark" ? "black" : "grey.100",
                color: mode === "dark" ? "text.secondary" : "text.primary",
                fontFamily: "monospace",
                fontSize: "0.875rem",
                overflowX: "auto",
                whiteSpace: "pre",
              }}
            >
              {mempool
                ? JSON.stringify(mempool, null, 2)
                : "Awaiting God Intervention..."}
            </Paper>
          </Paper>
        </Box>

        {/* Main Content Area (D3 Map) */}
        <Paper
          elevation={6}
          sx={{
            flexGrow: 1,
            display: "flex",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <NetworkMap />
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
