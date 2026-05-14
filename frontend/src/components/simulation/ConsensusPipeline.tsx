import React, { useState, useEffect } from "react";
import { Typography, Grid, Card, CardContent, Chip, Box, Paper, Tabs, Tab } from "@mui/material";
import { GitBranch } from "lucide-react";
import { useSimulationStore } from "@/store/useSimulationStore";
import { formatTroops } from "@/utils/formatUtils";

const ConsensusPipeline: React.FC = () => {
  const { step, mempool, alliances } = useSimulationStore();

  const [lastActionInfo, setLastActionInfo] = useState<{
    type: string;
    target: string;
    change?: number;
    starting_troops?: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    if (mempool) {
      setLastActionInfo({
        type: mempool.type,
        target: mempool.target,
        change: mempool.change,
        starting_troops: mempool.starting_troops,
      });
      setActiveTab(0);
    } else if (step === 0 && alliances.length > 0) {
      setActiveTab(2);
    }
  }, [mempool, step, alliances]);

  return (
    <Paper elevation={6} className="flex flex-col gap-4 p-6">
      <Box className="flex items-center justify-between">
        <Typography variant="h6" className="flex items-center gap-2" sx={{ fontWeight: "bold" }}>
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
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
          <Tab label="Request" />
          <Tab label="Consensus" />
          <Tab label="Results" disabled={step !== 0 || alliances.length === 0} />
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
                          {formatTroops(lastActionInfo.change)} Troops
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* TAB 1: ACTION + SMART CONTRACT CONSENSUS */}
            {activeTab === 1 && (
              <Card
                variant="outlined"
                sx={{ bgcolor: "background.default", borderColor: step >= 1 ? "success.main" : "divider" }}
              >
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: step >= 1 ? "success.main" : "text.secondary",
                      fontWeight: "bold",
                      mb: 1,
                      display: "block",
                    }}
                  >
                    2. BLOCKCHAIN CONSENSUS
                  </Typography>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" sx={{ fontWeight: "bold", color: "text.secondary" }}>
                      SMART CONTRACT EXECUTION
                    </Typography>
                    {useSimulationStore.getState().actionWinner ? (
                      <Box sx={{ textAlign: "right" }}>
                        <Typography variant="subtitle2" sx={{ color: "success.main", fontWeight: 800 }}>
                          Mined by {useSimulationStore.getState().actionWinner}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "success.light", fontWeight: "bold" }}>
                          +{formatTroops(useSimulationStore.getState().currentReward)}
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
                        Nodes are hashing...
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

            {/* TAB 2: FINAL RESULTS */}
            {activeTab === 2 && (
              <Card
                variant="outlined"
                sx={{
                  bgcolor: "background.default",
                  borderColor: step === 0 && alliances.length > 0 ? "success.main" : "divider",
                }}
              >
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: step === 0 && alliances.length > 0 ? "success.main" : "text.secondary",
                      fontWeight: "bold",
                      mb: 1,
                      display: "block",
                    }}
                  >
                    3. FINAL RESULTS
                  </Typography>

                  {step !== 0 ? (
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
                  ) : step === 0 && alliances.length > 0 ? (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {alliances.map((members: string[], idx: number) => (
                        <Chip
                          key={`${idx}-${members.join("|")}`}
                          icon={<GitBranch size={12} />}
                          label={members.join(" • ")}
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
  );
};

export default ConsensusPipeline;
