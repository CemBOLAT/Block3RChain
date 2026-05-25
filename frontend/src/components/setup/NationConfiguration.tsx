import React from "react";
import { Box, Typography, TextField, IconButton } from "@mui/material";
import { Trash2 } from "lucide-react";
import { fromBackendUnits, toBackendUnits } from "@/utils/formatUtils";

type NationData = {
  troops: number;
  gold: number;
  population: number;
};

type NationConfigurationProps = {
  nation: string;
  data: NationData;
  onUpdate: (data: Partial<NationData>) => void;
  onRemove: () => void;
};

const NationConfiguration: React.FC<NationConfigurationProps> = ({ nation, data, onUpdate, onRemove }) => {
  return (
    <Box className="border rounded-sm p-3" sx={{ bgcolor: "action.hover", borderColor: "divider" }}>
      <Box className="flex justify-between items-center mb-3">
        <Typography variant="body2" className="!font-bold" sx={{ color: "primary.light" }}>
          {nation}
        </Typography>
        <IconButton size="small" onClick={onRemove} color="error" title={`Remove ${nation}`}>
          <Trash2 size={16} />
        </IconButton>
      </Box>

      <Box className="grid grid-cols-3 gap-2">
        <TextField
          size="small"
          label="Troops (K)"
          type="number"
          value={fromBackendUnits(data.troops)}
          onChange={(e) => onUpdate({ troops: toBackendUnits(Number.parseInt(e.target.value) || 0) })}
          slotProps={{ htmlInput: { min: 0 } }}
        />
        <TextField
          size="small"
          label="Gold (K)"
          type="number"
          value={fromBackendUnits(data.gold)}
          onChange={(e) => onUpdate({ gold: toBackendUnits(Number.parseInt(e.target.value) || 0) })}
          slotProps={{ htmlInput: { min: 0 } }}
        />
        <TextField
          size="small"
          label="Pop (M)"
          type="number"
          value={data.population}
          onChange={(e) => onUpdate({ population: Number.parseInt(e.target.value) || 0 })}
          slotProps={{ htmlInput: { min: 0 } }}
        />
      </Box>
    </Box>
  );
};

export default NationConfiguration;
