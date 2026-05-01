import React from "react";
import { Paper, IconButton } from "@mui/material";
import { ChevronRight } from "lucide-react";
import NetworkMap from "./NetworkMap";
import BlockChainHistory from "./BlockChainHistory";
import GameOverOverlay from "./GameOverOverlay";
import { useSimulationStore } from "@/store/useSimulationStore";

interface SimulationMapContainerProps {
  isSidebarCollapsed: boolean;
  onExpandSidebar: () => void;
  isHistoryOpen: boolean;
  onCloseHistory: () => void;
}

const SimulationMapContainer: React.FC<SimulationMapContainerProps> = ({
  isSidebarCollapsed,
  onExpandSidebar,
  isHistoryOpen,
  onCloseHistory,
}) => {
  const { alliances } = useSimulationStore();
  const isGameOver = alliances.includes("WORLD WAR 3: EQUILIBRIUM COLLAPSED");

  return (
    <Paper
      elevation={6}
      className="grow flex flex-col relative overflow-hidden"
      sx={{ transition: "margin 0.3s ease" }}
    >
      {/* Simulation Overlay Components */}
      {isGameOver && <GameOverOverlay />}

      {isSidebarCollapsed && (
        <IconButton
          onClick={onExpandSidebar}
          className="absolute top-4 left-4 z-1000 w-10 h-10"
          sx={{
            bgcolor: "background.paper",
            "&:hover": { bgcolor: "background.paper", opacity: 0.9 },
          }}
          title="Expand Sidebar"
        >
          <ChevronRight />
        </IconButton>
      )}

      {/* Main Simulation Content */}
      <NetworkMap />

      {/* Floating UI Overlays */}
      {isHistoryOpen && <BlockChainHistory onClose={onCloseHistory} />}
    </Paper>
  );
};

export default SimulationMapContainer;
