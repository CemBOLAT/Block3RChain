import React from "react";
import {
  Typography,
  Chip,
  Box,
  Paper,
  Divider,

} from "@mui/material";
import { GitBranch, Loader2 } from "lucide-react";
import { useSimulationStore } from "@/store/useSimulationStore";
import { formatTroops } from "@/utils/formatUtils";

function phaseLabel(step: number): { label: string; color: "success" | "warning" | "info" } {
  if (step === 0) return { label: "EQUILIBRIUM", color: "success" };
  if (step === 4) return { label: "FINALIZING", color: "info" };
  return { label: "MINING", color: "warning" };
}

function phaseDescription(step: number): string {
  if (step === 0) {
    return "World is at rest. Queue interventions on the map, then commit when ready.";
  }
  if (step === 4) {
    return "Applying the winning block and returning to equilibrium.";
  }
  return "Countries are applying interventions, running the economy, and racing to mine the block.";
}

const ConsensusPipeline: React.FC = () => {
  const {
    step,
    mempool,
    pendingInterventions,
    actionWinner,
    currentReward,
    chain_length,
    latest_block_hash,
  } = useSimulationStore();

  const phase = phaseLabel(step);
  const mempoolInterventions = mempool?.interventions ?? [];

  return (
    <Paper elevation={6} className="flex flex-col gap-3 p-4">
      <Box className="flex items-center justify-between gap-2">
        <Typography variant="h6" className="flex items-center gap-2" sx={{ fontWeight: "bold" }}>
          <GitBranch size={20} /> Round status
        </Typography>
        <Chip label={phase.label} color={phase.color} size="small" sx={{ fontWeight: "bold" }} />
      </Box>

      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {phaseDescription(step)}
      </Typography>

      <Divider />

      {step === 0 && pendingInterventions.length > 0 && (
        <Box>
          <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: "bold" }}>
            Pending ({pendingInterventions.length})
          </Typography>
          <Typography variant="caption" sx={{ display: "block", mb: 1, color: "text.secondary" }}>
            Full list in Intervention Queue above. Commit to start mining.
          </Typography>
        </Box>
      )}

      {step !== 0 && mempool && (
        <Box>
          <Typography variant="overline" sx={{ color: "primary.main", fontWeight: "bold" }}>
            Active round
          </Typography>
          <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mb: 1 }}>
            {mempoolInterventions.length} intervention(s) · base reward{" "}
            {formatTroops(mempool.base_reward ?? 0)}
          </Typography>
          {mempoolInterventions.length > 0 && (
            <Typography variant="body2" component="div" sx={{ mt: 0.5 }}>
              {mempoolInterventions.map((item, idx) => (
                <Chip
                  key={`${item.type}-${item.target}-${idx}`}
                  size="small"
                  label={`${item.type.replace(/_/g, " ")} · ${item.target}`}
                  sx={{ mr: 0.5, mb: 0.5 }}
                />
              ))}
            </Typography>
          )}
        </Box>
      )}

      <Box>
        <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: "bold" }}>
          Mining
        </Typography>
        {actionWinner ? (
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
            Block mined by {actionWinner}
            {currentReward > 0 && (
              <Typography component="span" variant="body2" sx={{ color: "success.main", ml: 1 }}>
                (+{formatTroops(currentReward)})
              </Typography>
            )}
          </Typography>
        ) : step !== 0 ? (
          <Box className="flex items-center gap-2" sx={{ color: "warning.main" }}>
            <Loader2 size={16} className="animate-spin" />
            <Typography variant="body2" sx={{ fontStyle: "italic" }}>
              Waiting for first valid block…
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" sx={{ color: "text.disabled", fontStyle: "italic" }}>
            No active mining round.
          </Typography>
        )}
      </Box>

      {step === 0 && chain_length > 0 && (
        <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace" }}>
          Chain length: {chain_length}
          {latest_block_hash ? ` · latest ${latest_block_hash.slice(0, 12)}…` : ""}
        </Typography>
      )}
    </Paper>
  );
};

export default ConsensusPipeline;
