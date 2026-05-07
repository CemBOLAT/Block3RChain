import React from "react";
import { Box, Paper, Typography, Divider } from "@mui/material";
import { Link as LinkIcon } from "lucide-react";
import { useSimulationStore } from "@/store/useSimulationStore";

const AlliancesList: React.FC = () => {
  const { alliances, chain_length } = useSimulationStore();

  return (
    <Box>
      <Paper variant="outlined" className="flex flex-col p-4" sx={{ bgcolor: "background.default" }}>
        <Typography
          variant="overline"
          className="!font-bold flex items-center gap-2 mb-2"
          sx={{ color: "text.secondary" }}
        >
          <LinkIcon size={14} /> Alliances
        </Typography>
        <Box className="flex flex-col gap-1" sx={{ color: "success.light" }}>
          {alliances.length > 0 ? (
            alliances.map((a) => (
              <Typography key={a} variant="body2">
                {a}
              </Typography>
            ))
          ) : (
            <Typography variant="body2" className="italic">
              There is no active alliance.
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
