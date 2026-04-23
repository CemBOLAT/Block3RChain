import React from "react";
import { Box, IconButton } from "@mui/material";
import { ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";

const GameSetupMap = dynamic(() => import("./GameSetupMap"), {
  ssr: false,
});

interface SetupMapContainerProps {
  isCollapsed: boolean;
  onExpand: () => void;
  nations: Record<string, number>;
  onCountryClick?: (countryName: string) => void;
}

const SetupMapContainer: React.FC<SetupMapContainerProps> = ({
  isCollapsed,
  onExpand,
  nations,
  onCountryClick,
}) => {
  return (
    <Box sx={{ flexGrow: 1, height: "100%", position: "relative" }}>
      {isCollapsed && (
        <IconButton
          onClick={onExpand}
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
      <GameSetupMap nations={nations} onCountryClick={onCountryClick} />
    </Box>
  );
};

export default SetupMapContainer;
