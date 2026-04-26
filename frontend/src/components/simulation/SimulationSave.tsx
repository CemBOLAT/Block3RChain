import React, { useState } from "react";
import { 
  Box, IconButton, Typography, Popover, TextField, Button, useTheme 
} from "@mui/material";
import { Save } from "lucide-react";
import { useSimulationStore } from "@/store/useSimulationStore";
import { useGameSetupStore } from "@/store/useGameSetupStore";

const SimulationSave: React.FC = () => {
  const { step } = useSimulationStore();
  const { saveCurrentGame } = useGameSetupStore();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [saveName, setSaveName] = useState("");

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setSaveName("");
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSubmit = () => {
    if (!saveName || step !== 0) return;
    saveCurrentGame(saveName);
    handleClose();
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton size="small" onClick={handleOpen} title="Save Simulation State">
        <Save />
      </IconButton>
      
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
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
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1, mb: 2 }}
        >
          <Save size={16} /> Save Simulation State
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            autoFocus
            size="small"
            placeholder="Save name..."
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            sx={{ flexGrow: 1 }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <Button
            size="small"
            variant="contained"
            onClick={handleSubmit}
            disabled={!saveName || step !== 0}
            sx={{ fontWeight: "bold" }}
          >
            Save
          </Button>
        </Box>
        {step !== 0 && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
            Can only save during Equilibrium (Step 0)
          </Typography>
        )}
      </Popover>
    </>
  );
};

export default SimulationSave;
