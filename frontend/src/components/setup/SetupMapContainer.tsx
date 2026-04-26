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
    <Box sx={{ flexGrow: 1, height: "100%", position: "relative" }}>
      {isSidebarCollapsed && (
        <IconButton
          onClick={() => setSidebarCollapsed(false)}
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
            zIndex: 1000,
            bgcolor: "background.paper",
            boxShadow: 3,
            "&:hover": { bgcolor: "background.paper", opacity: 0.9 },
          }}
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
