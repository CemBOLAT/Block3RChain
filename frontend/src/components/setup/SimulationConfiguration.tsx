import React from "react";
import { Box, Typography, Paper, TextField, IconButton } from "@mui/material";
import { Shield, Trash2 } from "lucide-react";
import { useGameSetupStore } from "@/store/useGameSetupStore";
import { fromBackendUnits, toBackendUnits } from "@/utils/formatUtils";

const SimulationConfiguration: React.FC = () => {
  const { selectedTemplate, editableNations, updateNation, removeNation } = useGameSetupStore();

  if (!selectedTemplate) return null;

  return (
    <Box className="grow flex flex-col gap-3 overflow-y-auto">
      <Paper variant="outlined" className="flex flex-col gap-4 p-4">
        <Typography variant="subtitle2" className="flex items-center gap-2">
          <Shield size={16} /> Nation Configuration
        </Typography>
        <Box className="flex flex-col gap-4">
          {Object.entries(editableNations).map(([nation, data]) => (
            <Box
              key={nation}
              className="border rounded-sm p-3"
              sx={{ bgcolor: "action.hover", borderColor: "divider" }}
            >
              <Box className="flex justify-between items-center mb-3">
                <Typography variant="body2" className="!font-bold" sx={{ color: "primary.light" }}>
                  {nation}
                </Typography>
                <IconButton size="small" onClick={() => removeNation(nation)} color="error" title={`Remove ${nation}`}>
                  <Trash2 size={16} />
                </IconButton>
              </Box>

              <Box className="grid grid-cols-3 gap-2">
                <TextField
                  size="small"
                  label="Troops (K)"
                  type="number"
                  value={fromBackendUnits(data.troops)}
                  onChange={(e) =>
                    updateNation(nation, { troops: toBackendUnits(Number.parseInt(e.target.value) || 0) })
                  }
                  slotProps={{ htmlInput: { min: 0 } }}
                />
                <TextField
                  size="small"
                  label="Gold (K)"
                  type="number"
                  value={fromBackendUnits(data.gold)}
                  onChange={(e) => updateNation(nation, { gold: toBackendUnits(Number.parseInt(e.target.value) || 0) })}
                  slotProps={{ htmlInput: { min: 0 } }}
                />
                <TextField
                  size="small"
                  label="Pop (M)"
                  type="number"
                  value={data.population}
                  onChange={(e) => updateNation(nation, { population: Number.parseInt(e.target.value) || 0 })}
                  slotProps={{ htmlInput: { min: 0 } }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default SimulationConfiguration;
