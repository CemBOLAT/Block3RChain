import React from "react";
import { Box } from "@mui/material";
import SetupSidebar from "./SetupSidebar";
import SetupMapContainer from "./SetupMapContainer";

const GameSetup: React.FC = () => {
  return (
    <Box className="flex h-screen w-screen overflow-hidden">
      <SetupSidebar />
      <SetupMapContainer />
    </Box>
  );
};

export default GameSetup;
