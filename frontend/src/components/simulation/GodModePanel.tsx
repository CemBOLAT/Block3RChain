import InterventionQueue from "./InterventionQueue";
import NationalStatistics from "./NationalStatistics";
import AlliancesList from "./AlliancesList";
import { useSimulationStore } from "@/store/useSimulationStore";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { Zap } from "lucide-react";

export default function GodModePanel() {
  const { step } = useSimulationStore();

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
