import React, { useState } from "react";
import InterventionQueue from "./InterventionQueue";
import NationalStatistics from "./NationalStatistics";
import AlliancesList from "./AlliancesList";
import { useSimulationStore } from "@/store/useSimulationStore";
import { Card, CardContent, Typography, Box, Paper, Autocomplete, TextField, Button } from "@mui/material";
import { Zap } from "lucide-react";

export default function GodModePanel() {
  const { step, ledger, triggerGodIntervention } = useSimulationStore();
  const [selectedCountry, setSelectedCountry] = useState<string | "">("");
  const [troopAmount, setTroopAmount] = useState(0);
  const [goldAmount, setGoldAmount] = useState(0);
  const [popAmount, setPopAmount] = useState(0);

  const handleIntervention = async () => {
    if (!selectedCountry) return;
    await triggerGodIntervention(selectedCountry, {
      troopChange: troopAmount,
      goldChange: goldAmount,
      popChange: popAmount,
    });
    // Reset fields after queuing
    setTroopAmount(0);
    setGoldAmount(0);
    setPopAmount(0);
  };

  return (
    <Card elevation={6} className="w-full flex flex-col grow" sx={{ bgcolor: "background.paper", overflowY: "auto" }}>
      <CardContent className="flex flex-col gap-6 shrink-0">
        {/* Header */}
        <Box>
          <Typography variant="h5" className="flex items-center gap-2 mb-1 !font-bold">
            <Zap color="#facc15" size={24} />
            God-Mode Panel
          </Typography>
          <Typography variant="caption" className="text-text-secondary">
            Current Phase Execution: Step {step}
          </Typography>
        </Box>

        {/* Intervention Form */}
        <Paper
          variant="outlined"
          sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2, bgcolor: "background.default" }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "text.primary" }}>
              Exogenous Shock
            </Typography>
          </Box>

          <Autocomplete
            size="small"
            options={Object.keys(ledger)}
            value={selectedCountry && Object.keys(ledger).includes(selectedCountry) ? selectedCountry : null}
            onChange={(_, newValue) => setSelectedCountry(newValue || "")}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={
                  Object.keys(ledger).length > 0 ? "Search country in ledger..." : "Waiting for simulation..."
                }
              />
            )}
            disabled={Object.keys(ledger).length === 0}
          />

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
            <Box>
              <Typography variant="caption" sx={{ ml: 1, color: "text.secondary", fontWeight: "bold" }}>
                Troops (K)
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={troopAmount}
                onChange={(e) => setTroopAmount(Number(e.target.value))}
              />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ ml: 1, color: "text.secondary", fontWeight: "bold" }}>
                Gold (K)
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={goldAmount}
                onChange={(e) => setGoldAmount(Number(e.target.value))}
              />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ ml: 1, color: "text.secondary", fontWeight: "bold" }}>
                Pop (M)
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={popAmount}
                onChange={(e) => setPopAmount(Number(e.target.value))}
              />
            </Box>
          </Box>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleIntervention}
            disabled={step !== 0 || !selectedCountry}
            startIcon={<Zap size={16} />}
            sx={{ fontWeight: "bold" }}
          >
            Queue Intervention
          </Button>
        </Paper>

        {/* Pending Queue Section */}
        <InterventionQueue />

        {/* Ledger & Info */}
        <Box className="flex flex-col gap-2">
          <NationalStatistics />
          <AlliancesList />
        </Box>
      </CardContent>
    </Card>
  );
}
