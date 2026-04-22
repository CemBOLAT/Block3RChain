import React, { useState, useEffect } from "react";
import { Box, Paper, Typography, IconButton } from "@mui/material";
import { GitBranch, ChevronLeft, ChevronRight } from "lucide-react";
import GodModePanel from "./GodModePanel";
import ResizablePanel from "./ResizablePanel";
import dynamic from "next/dynamic";
import { useSimulationStore } from "@/store/useSimulationStore";
import CONFIG from "@/config/appConfig";
import { useTheme } from "@mui/material/styles";

const NetworkMap = dynamic(() => import("./NetworkMap"), {
  ssr: false,
});

interface SimulationViewProps {}

const SimulationView: React.FC<SimulationViewProps> = () => {
  const { step, fetchState, mempool, connectWebSocket } = useSimulationStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const theme = useTheme();
  const mode = theme.palette.mode;

  useEffect(() => {
    fetchState();
    connectWebSocket();
  }, [fetchState, connectWebSocket]);

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        p: 4,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Left Sidebar: God Mode Controls */}
      <ResizablePanel initialWidth={450} minWidth={450} maxWidth={900} isCollapsed={isCollapsed}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            height: "100%",
          }}
        >
          {/* App Title & Sidebar Toggle */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: 1,
              minWidth: 450,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
              {CONFIG.appName}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton size="small" onClick={() => setIsCollapsed(true)} title="Collapse Sidebar">
                <ChevronLeft />
              </IconButton>
            </Box>
          </Box>

          <GodModePanel />

          {/* Pipeline Info */}
          <Paper elevation={6} sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
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
              {mempool ? JSON.stringify(mempool, null, 2) : "Awaiting God Intervention..."}
            </Paper>
          </Paper>
        </Box>
      </ResizablePanel>

      {/* Main Content Area (D3 Map) */}
      <Paper
        elevation={6}
        sx={{
          flexGrow: 1,
          display: "flex",
          position: "relative",
          overflow: "hidden",
          ml: isCollapsed ? 0 : 0,
          transition: "margin 0.3s ease",
        }}
      >
        {isCollapsed && (
          <IconButton
            onClick={() => setIsCollapsed(false)}
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              zIndex: 1000,
              bgcolor: "background.paper",
              boxShadow: 3,
              "&:hover": { bgcolor: "background.paper", opacity: 0.9 },
            }}
            title="Expand Sidebar"
          >
            <ChevronRight />
          </IconButton>
        )}
        <NetworkMap />
      </Paper>
    </Box>
  );
};

export default SimulationView;
