import React from "react";
import { Paper, Typography, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { Settings2 } from "lucide-react";
import { useGameSetupStore } from "@/store/useGameSetupStore";
import { useEffect } from "react";

const SimulationTemplateList: React.FC = () => {
  const { templates, selectedTemplate, selectTemplateById, fetchTemplates } = useGameSetupStore();

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
      <Typography variant="subtitle2" className="font-bold flex items-center gap-2 pb-2">
        <Settings2 size={16} /> Choose Template
      </Typography>
      <FormControl fullWidth size="small">
        <InputLabel id="setup-dropdown-label">Select Simulation Template</InputLabel>
        <Select
          labelId="setup-dropdown-label"
          id="setup-dropdown"
          value={selectedTemplate?.id || ""}
          label="Select Simulation Template"
          onChange={(e) => selectTemplateById(e.target.value)}
        >
          {templates.map((sim) => (
            <MenuItem key={sim.id} value={sim.id}>
              {sim.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Paper>
  );
};

export default SimulationTemplateList;
