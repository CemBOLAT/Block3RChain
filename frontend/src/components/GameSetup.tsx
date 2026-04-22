import React from "react";
import { Box, Paper, Typography, Button, TextField } from "@mui/material";
import CONFIG from "@/config/appConfig";

interface GameSetupProps {
  onStart: () => void;
}

const GameSetup: React.FC<GameSetupProps> = ({ onStart }) => {
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 4,
        bgcolor: "background.default",
      }}
    >
      <Paper
        elevation={10}
        sx={{
          p: 6,
          maxWidth: 500,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          borderRadius: 4,
          textAlign: "center",
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -1 }}>
          {CONFIG.appName}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {CONFIG.appDescription}
        </Typography>

        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
          <TextField
            fullWidth
            label="Simulation Name"
            placeholder="e.g. My Geopolitical Sim"
            variant="outlined"
          />
          
          <Button
            variant="contained"
            size="large"
            onClick={onStart}
            sx={{
              py: 2,
              fontWeight: "bold",
              fontSize: "1.1rem",
              borderRadius: 2,
              textTransform: "none",
            }}
          >
            Initialize Simulation
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default GameSetup;
