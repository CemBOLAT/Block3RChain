import React, { useState } from "react";
import { Box, IconButton, Typography, Popover, TextField, Button, useTheme } from "@mui/material";
import { Save } from "lucide-react";
import { useSimulationStore } from "@/store/useSimulationStore";

const SimulationSave: React.FC = () => {
  const { step, saveCurrentGame } = useSimulationStore();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [saveName, setSaveName] = useState("");

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setSaveName("");
  };

  const handleSubmit = () => {
    if (!saveName || step !== 0) return;
    saveCurrentGame(saveName);
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton size="small" onClick={handleOpen} title="Save Simulation State">
        <Save />
      </IconButton>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        slotProps={{
          paper: {
            sx: {
              p: 2,
              width: 300,
              mt: 1,
              border: "1px solid",
              borderColor: "primary.main",
              bgcolor: "background.paper",
              boxShadow: theme.shadows[10],
            },
          },
        }}
      >
        <Typography variant="subtitle2" className="!font-bold flex items-center gap-2">
          <Save size={16} /> Save Simulation State
        </Typography>
        <Box className="flex gap-2 mt-2">
          <TextField
            autoFocus
            size="small"
            placeholder="Save name..."
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            className="grow"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <Button
            size="small"
            variant="contained"
            onClick={handleSubmit}
            disabled={!saveName || step !== 0}
            className="!font-bold"
            color="success"
          >
            Save
          </Button>
        </Box>
        {step !== 0 && (
          <Typography variant="caption" color="error" className="mt-2 block">
            Can only save during Equilibrium (Step 0)
          </Typography>
        )}
      </Popover>
    </>
  );
};

export default SimulationSave;
