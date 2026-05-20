import React from "react";
import { Box, Typography } from "@mui/material";

const GameOverOverlay: React.FC = () => {
  return (
    <Box
      className="absolute top-0 left-0 right-0 bottom-0 z-999 flex flex-col items-center justify-center text-white"
      sx={{ bgcolor: "rgba(100, 0, 0, 0.8)" }}
    >
      <Typography
        variant="h2"
        sx={{ fontWeight: 900, mb: 2, letterSpacing: 2, textShadow: "2px 2px 10px black" }}
      >
        GAME OVER
      </Typography>
      <Typography
        variant="h5"
        sx={{ fontWeight: "bold", textShadow: "1px 1px 5px black", textAlign: "center", maxWidth: "80%" }}
      >
        WORLD WAR III HAS BEGUN
      </Typography>
      <Typography
        variant="subtitle1"
        sx={{ mt: 2, fontStyle: "italic", textShadow: "1px 1px 5px black", textAlign: "center", maxWidth: "70%" }}
      >
        The alliance solver could not find any stable multipolar partition: no layout satisfies the
        1.5× power-balance rule and every country&apos;s incentive to stay in its bloc. Adjust troops or
        interventions and commit again.
      </Typography>
    </Box>
  );
};

export default GameOverOverlay;
