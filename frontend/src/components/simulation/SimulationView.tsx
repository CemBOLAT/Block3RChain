import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Slide,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Tooltip,
  Divider,
  Box,
  Paper,
  IconButton,
  Tabs,
  Tab,
  Collapse,
} from "@mui/material";
import { GitBranch, ChevronLeft, ChevronRight, History } from "lucide-react";
import BlockChainHistory from "./BlockChainHistory";
import SimulationSave from "./SimulationSave";
import GodModePanel from "./GodModePanel";
import ResizablePanel from "../common/ResizablePanel";
import dynamic from "next/dynamic";
import { useSimulationStore } from "@/store/useSimulationStore";
import CONFIG from "@/config/appConfig";
import { useTheme } from "@mui/material/styles";

const NetworkMap = dynamic(() => import("./NetworkMap"), {
  ssr: false,
});

const Transition = React.forwardRef(function Transition(props: any, ref: React.Ref<unknown>) {
  const { children, ...other } = props;
  return (
    <Slide direction="up" ref={ref} {...other}>
      {children}
    </Slide>
  );
});

interface SimulationViewProps {}

const SimulationView: React.FC<SimulationViewProps> = () => {
  const { step, fetchState, mempool, connectWebSocket, alliances } = useSimulationStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const theme = useTheme();

  const [lastActionInfo, setLastActionInfo] = useState<{
    type: string;
    target: string;
    change?: number;
    starting_troops?: number;
  } | null>(null);
  const [lastSolverInfo, setLastSolverInfo] = useState<{ new_alliances: string[] } | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    if (mempool) {
      if (mempool.phase === 1) {
        setLastActionInfo({
          type: mempool.type,
          target: mempool.target,
          change: mempool.change,
          starting_troops: mempool.starting_troops,
        });
        setLastSolverInfo(null);
        setActiveTab(0);
      } else if (mempool.phase === 3) {
        setLastSolverInfo({ new_alliances: mempool.data?.new_alliances || [] });
        setActiveTab(3);
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
              <IconButton
                size="small"
                onClick={() => {
                  setIsHistoryOpen((prev) => !prev);
                }}
                title="View Blockchain History"
              >
                <History />
              </IconButton>
              <SimulationSave />
              <IconButton size="small" onClick={() => setIsCollapsed(true)} title="Collapse Sidebar">
                <ChevronLeft />
              </IconButton>
            </Box>
          </Box>

          <GodModePanel />

          {/* Pipeline Info */}
          <Paper elevation={6} sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
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
                {step === 0 ? "EQUILIBRIUM" : `STEP ${step}/4`}
              </Typography>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={activeTab}
                onChange={(_, val) => setActiveTab(val)}
                aria-label="pipeline tabs"
                sx={{ minHeight: 36 }}
              >
                <Tab label="Request" sx={{ minHeight: 36, py: 0 }} />
                <Tab label="Block 1" sx={{ minHeight: 36, py: 0 }} />
                <Tab label="Block 2" sx={{ minHeight: 36, py: 0 }} />
                <Tab label="Results" disabled={!lastSolverInfo} sx={{ minHeight: 36, py: 0 }} />
              </Tabs>
            </Box>

            <Box sx={{ p: 1, flexGrow: 1, overflowY: "auto" }}>
              {!lastActionInfo ? (
                <Typography color="text.secondary" variant="body2" sx={{ fontStyle: "italic", p: 1 }}>
                  Awaiting Action...
                </Typography>
              ) : (
                <Box>
                  {/* TAB 0: ACTION DETAILS */}
                  {activeTab === 0 && (
                    <Card
                      variant="outlined"
                      sx={{ bgcolor: "background.default", borderColor: step >= 1 ? "primary.main" : "divider" }}
                    >
                      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                        <Typography
                          variant="caption"
                          sx={{ color: "primary.main", fontWeight: "bold", mb: 1, display: "block" }}
                        >
                          1. ACTION REQUEST
                        </Typography>
                        <Grid container spacing={1}>
                          <Grid size={{ xs: 6 }}>
                            <Typography
                              variant="overline"
                              sx={{ color: "text.secondary", fontWeight: "bold", display: "block", lineHeight: 1 }}
                            >
                              TYPE
                            </Typography>
                            <Typography variant="subtitle2" sx={{ color: "text.primary", fontWeight: 800 }}>
                              {lastActionInfo.type.replace(/_/g, " ").replace(" + REWARD", "")}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 6 }}>
                            <Typography
                              variant="overline"
                              sx={{ color: "text.secondary", fontWeight: "bold", display: "block", lineHeight: 1 }}
                            >
                              TARGET
                            </Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                              {lastActionInfo.target}
                            </Typography>
                          </Grid>
                          {lastActionInfo.change !== undefined && (
                            <Grid size={{ xs: 12 }}>
                              <Typography
                                variant="overline"
                                sx={{ color: "text.secondary", fontWeight: "bold", display: "block", lineHeight: 1 }}
                              >
                                VALUE
                              </Typography>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  color: lastActionInfo.change >= 0 ? "success.main" : "error.main",
                                  fontWeight: 800,
                                }}
                              >
                                {lastActionInfo.change > 0 ? "+" : ""}
                                {lastActionInfo.change.toLocaleString()} Troops
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </CardContent>
                    </Card>
                  )}

                  {/* TAB 1: ACTION CONSENSUS */}
                  {activeTab === 1 && (
                    <Card
                      variant="outlined"
                      sx={{ bgcolor: "background.default", borderColor: step >= 2 ? "success.main" : "divider" }}
                    >
                      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: step >= 2 ? "success.main" : "text.secondary",
                            fontWeight: "bold",
                            mb: 1,
                            display: "block",
                          }}
                        >
                          2. ACTION CONSENSUS
                        </Typography>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography variant="body2" sx={{ fontWeight: "bold", color: "text.secondary" }}>
                            ACTION + REWARD
                          </Typography>
                          {useSimulationStore.getState().actionWinner ? (
                            <Box sx={{ textAlign: "right" }}>
                              <Typography variant="subtitle2" sx={{ color: "success.main", fontWeight: 800 }}>
                                {useSimulationStore.getState().actionWinner}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "success.light", fontWeight: "bold" }}>
                                +{useSimulationStore.getState().currentReward} TROOPS
                              </Typography>
                            </Box>
                          ) : step >= 1 ? (
                            <Typography
                              variant="caption"
                              sx={{
                                color: "warning.main",
                                fontStyle: "italic",
                                animation: "pulse 1.5s infinite ease-in-out",
                              }}
                            >
                              Mining...
                            </Typography>
                          ) : (
                            <Typography variant="caption" sx={{ color: "text.disabled" }}>
                              Waiting...
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  )}

                  {/* TAB 2: ALLIANCE CONSENSUS */}
                  {activeTab === 2 && (
                    <Card
                      variant="outlined"
                      sx={{ bgcolor: "background.default", borderColor: step >= 4 ? "success.main" : "divider" }}
                    >
                      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: step >= 4 ? "success.main" : "text.secondary",
                            fontWeight: "bold",
                            mb: 1,
                            display: "block",
                          }}
                        >
                          3. ALLIANCE CONSENSUS
                        </Typography>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography variant="body2" sx={{ fontWeight: "bold", color: "text.secondary" }}>
                            ALLIANCE SOLVED + REWARD
                          </Typography>
                          {useSimulationStore.getState().allianceWinner ? (
                            <Box sx={{ textAlign: "right" }}>
                              <Typography variant="subtitle2" sx={{ color: "success.main", fontWeight: 800 }}>
                                {useSimulationStore.getState().allianceWinner}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "success.light", fontWeight: "bold" }}>
                                +{useSimulationStore.getState().currentReward} TROOPS
                              </Typography>
                            </Box>
                          ) : step >= 3 ? (
                            <Typography
                              variant="caption"
                              sx={{
                                color: "warning.main",
                                fontStyle: "italic",
                                animation: "pulse 1.5s infinite ease-in-out",
                              }}
                            >
                              Mining...
                            </Typography>
                          ) : (
                            <Typography variant="caption" sx={{ color: "text.disabled" }}>
                              Waiting...
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  )}

                  {/* TAB 3: FINAL RESULTS */}
                  {activeTab === 3 && (
                    <Card
                      variant="outlined"
                      sx={{
                        bgcolor: "background.default",
                        borderColor: (step >= 4 || step === 0) && alliances.length > 0 ? "success.main" : "divider",
                      }}
                    >
                      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color:
                              (step >= 4 || step === 0) && alliances.length > 0 ? "success.main" : "text.secondary",
                            fontWeight: "bold",
                            mb: 1,
                            display: "block",
                          }}
                        >
                          4. FINAL RESULTS
                        </Typography>

                        {step === 3 ? (
                          <Box sx={{ py: 2, textAlign: "center" }}>
                            <Typography
                              variant="caption"
                              sx={{
                                display: "block",
                                color: "warning.main",
                                fontStyle: "italic",
                                animation: "pulse 1.5s infinite ease-in-out",
                              }}
                            >
                              Consensus in Progress...
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Nodes are validating global equilibrium
                            </Typography>
                          </Box>
                        ) : (step >= 4 || step === 0) && alliances.length > 0 ? (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                            {alliances.map((alliance: string, idx: number) => (
                              <Chip
                                key={idx}
                                icon={<GitBranch size={12} />}
                                label={alliance.replace("-", " <-> ")}
                                variant="outlined"
                                color="success"
                                size="small"
                                sx={{ fontWeight: "bold" }}
                              />
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="caption" sx={{ color: "text.disabled" }}>
                            Waiting for consensus...
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
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

        {/* Blockchain Explorer Overlay (Over Map Only) */}
        {isHistoryOpen && <BlockChainHistory onClose={() => setIsHistoryOpen(false)} />}
      </Paper>
    </Box>
  );
};

export default SimulationView;
