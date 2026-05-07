import React from "react";
import { Box, Paper, Typography, IconButton } from "@mui/material";
import { Shield, Trash2, Coins, Users } from "lucide-react";
import { formatTroops, formatGold } from "@/utils/formatUtils";
import { useSimulationStore } from "@/store/useSimulationStore";

const NationalStatistics: React.FC = () => {
  const { ledger, gold_ledger, pop_ledger, removeCountry } = useSimulationStore();

  return (
    <Box>
      <Paper variant="outlined" className="flex flex-col gap-2 p-4" sx={{ bgcolor: "background.default" }}>
        <Typography variant="overline" className="!font-bold flex items-center gap-2" sx={{ color: "text.secondary" }}>
          <Shield size={14} /> National Statistics
        </Typography>
        <Box className="flex flex-col gap-3">
          {Object.entries(ledger).map(([c, val]) => (
            <Box
              key={c}
              className="flex items-center gap-2 border rounded-sm p-2"
              sx={{ bgcolor: "action.hover", borderColor: "divider" }}
            >
              <IconButton size="small" color="error" onClick={() => removeCountry(c)} sx={{ p: 0.2 }}>
                <Trash2 size={14} />
              </IconButton>
              <Typography variant="body2" color="primary.light" className="!font-bold min-w-[80px]">
                {c}
              </Typography>

              <div className="grow" />

              <div className="flex items-center">
                {/* Troops */}
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-sm">⚔️</span>
                  <Typography variant="body2" className="!font-mono !font-bold">
                    {formatTroops(val)}
                  </Typography>
                </div>

                {/* Gold */}
                <div className="flex items-center gap-1 w-20 justify-end">
                  <Coins size={14} color="#f59e0b" />
                  <Typography variant="caption" className="!font-bold text-amber-500">
                    {formatGold(gold_ledger[c] || 0)}
                  </Typography>
                </div>

                {/* Population */}
                <div className="flex items-center gap-1 w-20 justify-end">
                  <Users size={14} color="#3b82f6" />
                  <Typography variant="caption" className="!font-bold text-blue-500">
                    {pop_ledger[c] || 0}M
                  </Typography>
                </div>
              </div>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default NationalStatistics;
