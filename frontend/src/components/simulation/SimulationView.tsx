import React, { useState, useEffect } from "react";
import { Box, Paper, Typography, IconButton, Tabs, Tab } from "@mui/material";
import { GitBranch, ChevronLeft, ChevronRight } from "lucide-react";
import GodModePanel from "./GodModePanel";
import ResizablePanel from "../common/ResizablePanel";
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

  const [lastActionInfo, setLastActionInfo] = useState<{ target: string; change: number } | null>(null);
  const [lastSolverInfo, setLastSolverInfo] = useState<{ new_alliances: string[] } | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    if (mempool) {
      if (mempool.phase === 1 && mempool.type === "GOD_INTERVENTION") {
        setLastActionInfo({ target: mempool.target, change: mempool.change });
        setLastSolverInfo(null);
        setActiveTab(0);
      } else if (mempool.phase === 3 && mempool.type === "GOD_INTERVENTION") {
        setLastSolverInfo({ new_alliances: mempool.data?.new_alliances || [] });
        setActiveTab(1);
      }
    }
  }, [mempool]);

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

            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs 
                value={activeTab} 
                onChange={(_, val) => setActiveTab(val)} 
                aria-label="pipeline tabs"
                sx={{ minHeight: 36 }}
              >
                <Tab label="Action" sx={{ minHeight: 36, py: 0 }} />
                <Tab label="Solver" disabled={!lastSolverInfo} sx={{ minHeight: 36, py: 0 }} />
              </Tabs>
            </Box>
            
            <Box sx={{ minHeight: 120, p: 1 }}>
              {activeTab === 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {!lastActionInfo ? (
                    <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic' }}>
                      Awaiting God Intervention...
                    </Typography>
                  ) : (
                    <>
                      <Box>
                        <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 'bold', lineHeight: 1 }}>
                          TARGET NATION
                        </Typography>
                        <Typography variant="h6" color="primary.main">
                          {lastActionInfo.target}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 'bold', lineHeight: 1 }}>
                          TROOP CHANGE
                        </Typography>
                        <Typography variant="h6" sx={{ color: lastActionInfo.change >= 0 ? "success.main" : "error.main" }}>
                          {lastActionInfo.change > 0 ? "+" : ""}{lastActionInfo.change.toLocaleString()}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              )}
              {activeTab === 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 'bold', lineHeight: 1 }}>
                    NASH EQUILIBRIUM ALLIANCES
                  </Typography>
                  {lastSolverInfo?.new_alliances && lastSolverInfo.new_alliances.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                      {lastSolverInfo.new_alliances.map((alliance: string, idx: number) => (
                        <Typography key={idx} variant="body2" sx={{ fontFamily: 'monospace', color: 'success.light', display: 'flex', alignItems: 'center', gap: 1 }}>
                          <GitBranch size={14} /> {alliance}
                        </Typography>
                      ))}
                    </Box>
                  ) : (
                    <Typography color="text.secondary" variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                      No alliances formed.
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
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
