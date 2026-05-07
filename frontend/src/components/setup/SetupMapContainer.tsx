import React from "react";
import { Box, IconButton } from "@mui/material";
import { ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import { useGameSetupStore } from "@/store/useGameSetupStore";

const GameSetupMap = dynamic(() => import("./GameSetupMap"), {
  ssr: false,
});

const SetupMapContainer: React.FC = () => {
  const { isSidebarCollapsed, setSidebarCollapsed } = useGameSetupStore();

  return (
    <Box className="grow h-full relative">
      {isSidebarCollapsed && (
        <IconButton
          onClick={() => setSidebarCollapsed(false)}
          className="!absolute top-4 left-4 z-1000"
          sx={{ bgcolor: "background.paper" }}
          title="Expand Sidebar"
        >
          <ChevronRight />
        </IconButton>
      )}
      <GameSetupMap />
    </Box>
  );
};

export default SetupMapContainer;
