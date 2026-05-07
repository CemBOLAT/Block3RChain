import React, { useState, useEffect } from "react";
import { Typography, Box, IconButton } from "@mui/material";
import { ChevronLeft, Database } from "lucide-react";
import SimulationSave from "./SimulationSave";
import GodModePanel from "./GodModePanel";
import ConsensusPipeline from "./ConsensusPipeline";
import ResizablePanel from "../common/ResizablePanel";
import dynamic from "next/dynamic";
import { useSimulationStore } from "@/store/useSimulationStore";
import CONFIG from "@/config/appConfig";

const SimulationMapContainer = dynamic(() => import("./SimulationMapContainer"), {
  ssr: false,
});

const SimulationView: React.FC = () => {
  const { fetchState, connectWebSocket } = useSimulationStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    fetchState();
    connectWebSocket();
  }, [fetchState, connectWebSocket]);

  return (
    <Box className="h-screen flex p-4 overflow-hidden relative">
      {/* Left Sidebar: God Mode Controls */}
      <ResizablePanel initialWidth={450} minWidth={450} maxWidth={900} isCollapsed={isCollapsed}>
        <Box className="flex flex-col gap-6 h-full">
          {/* Sidebar Header: Title and Actions */}
          <Box className="flex items-center justify-between px-2 min-w-[450px]">
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
              {CONFIG.appName}
            </Typography>
            <Box className="flex items-center gap-2">
              <IconButton
                size="small"
                onClick={() => setIsHistoryOpen((prev) => !prev)}
                title="View Blockchain History"
              >
                <Database />
              </IconButton>
              <SimulationSave />
              <IconButton size="small" onClick={() => setIsCollapsed(true)} title="Collapse Sidebar">
                <ChevronLeft />
              </IconButton>
            </Box>
          </Box>

          <GodModePanel />

          {/* Pipeline Info */}
          <ConsensusPipeline />
        </Box>
      </ResizablePanel>

      {/* Main Content Area (D3 Map) */}
      <SimulationMapContainer
        isSidebarCollapsed={isCollapsed}
        onExpandSidebar={() => setIsCollapsed(false)}
        isHistoryOpen={isHistoryOpen}
        onCloseHistory={() => setIsHistoryOpen(false)}
      />
    </Box>
  );
};

export default SimulationView;
