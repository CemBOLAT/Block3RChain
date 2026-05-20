import React from "react";
import { Box, Paper, Typography, Divider, Chip } from "@mui/material";
import { Link as LinkIcon } from "lucide-react";
import { useSimulationStore } from "@/store/useSimulationStore";

const AlliancesList: React.FC = () => {
  const { alliances, alliance_stability_score, alliance_status, chain_length } = useSimulationStore();

  const hasAlliances = alliances.length > 0;
  const scoreLabel =
    alliance_stability_score === null || alliance_stability_score === undefined
      ? null
      : `stability ${alliance_stability_score.toFixed(2)}`;

  const isUnstableWorld = alliance_status === "NO_STABLE_PARTITION";

  return (
    <Box>
      <Paper variant="outlined" className="flex flex-col p-4" sx={{ bgcolor: "background.default" }}>
        <Box className="flex items-center justify-between mb-2">
          <Typography
            variant="overline"
            className="!font-bold flex items-center gap-2"
            sx={{ color: "text.secondary" }}
          >
            <LinkIcon size={14} /> Alliances
          </Typography>
          {scoreLabel && (
            <Chip
              size="small"
              variant="outlined"
              label={scoreLabel}
              color={isUnstableWorld ? "error" : "success"}
              sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}
            />
          )}
        </Box>

        <Box className="flex flex-col gap-1" sx={{ color: "success.light" }}>
          {hasAlliances ? (
            alliances.map((members, idx) => (
              <Typography key={`${idx}-${members.join("|")}`} variant="body2">
                {members.join(" • ")}
              </Typography>
            ))
          ) : (
            <Typography variant="body2" className="italic">
              {isUnstableWorld
                ? "No stable partition (unstable world)."
                : "There is no active alliance."}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 1 }} />

        <Box className="flex items-center justify-end gap-2">
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Chain Length:
          </Typography>
          <Typography variant="caption" className="!font-mono !font-bold">
            {chain_length}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default AlliancesList;
