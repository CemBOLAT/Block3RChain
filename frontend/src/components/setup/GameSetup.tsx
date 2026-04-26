import React from "react";
import { Box } from "@mui/material";
import SetupSidebar from "./SetupSidebar";
import SetupMapContainer from "./SetupMapContainer";

const GameSetup: React.FC = () => {
  return (
    <Box sx={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
      <SetupSidebar />
      <SetupMapContainer />
    </Box>
  );
};

export default GameSetup;
