import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import { Zap } from "lucide-react";
import { useSimulationStore } from "@/store/useSimulationStore";
import { Mempool } from "@/types/simulation";
import InterventionItem from "./InterventionItem";

const InterventionQueue: React.FC = () => {
  const { pendingInterventions, commitInterventions, removePendingIntervention, step } = useSimulationStore();

  if (pendingInterventions.length === 0) return null;

  return (
    <Paper
      variant="outlined"
      className="flex flex-col gap-4 p-4"
      sx={{ bgcolor: "action.hover", borderColor: "warning.main" }}
    >
      <Box className="flex items-center justify-between">
        <Typography variant="subtitle2" className="!font-bold flex items-center gap-2">
          <Zap size={16} color="#facc15" /> Pending Queue ({pendingInterventions.length})
        </Typography>
        <Button
          variant="contained"
          size="small"
          color="warning"
          onClick={commitInterventions}
          disabled={step !== 0}
          className="!font-bold"
        >
          COMMIT
        </Button>
      </Box>

      {/* Intervention List */}
      <Box className="flex flex-col gap-2 !min-h-[175px] !max-h-[175px] !overflow-y-auto">
        {pendingInterventions.map((item: Mempool, idx: number) => (
          <InterventionItem key={idx} item={item} onRemove={() => removePendingIntervention(idx)} />
        ))}
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
        Blocks will be mined containing all these interventions.
      </Typography>
    </Paper>
  );
};

export default InterventionQueue;
