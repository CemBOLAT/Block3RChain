import React from "react";
import InterventionQueue from "./InterventionQueue";
import NationalStatistics from "./NationalStatistics";
import AlliancesList from "./AlliancesList";
import { useSimulationStore } from "@/store/useSimulationStore";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { Zap } from "lucide-react";

export default function GodModePanel() {
  const { step } = useSimulationStore();

  const phaseHint =
    step === 0
      ? "Equilibrium — left-click countries on the map to queue interventions"
      : "Mining in progress — wait for consensus";

  return (
    <Card elevation={6} className="w-full flex flex-col grow" sx={{ bgcolor: "background.paper", overflowY: "auto" }}>
      <CardContent className="flex flex-col gap-6 shrink-0">
        <Box>
          <Typography variant="h5" className="flex items-center gap-2 mb-1 !font-bold">
            <Zap color="#facc15" size={24} />
            God-Mode Panel
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {phaseHint}
          </Typography>
        </Box>

        <InterventionQueue />

        <Box className="flex flex-col gap-2">
          <NationalStatistics />
          <AlliancesList />
        </Box>
      </CardContent>
    </Card>
  );
}
