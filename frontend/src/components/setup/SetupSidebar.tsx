import React from "react";
import { Box, Typography, IconButton, Button, Card, CardContent } from "@mui/material";
import { ChevronLeft, Zap } from "lucide-react";
import CONFIG from "@/config/appConfig";
import ResizablePanel from "../common/ResizablePanel";
import { useGameSetupStore } from "@/store/useGameSetupStore";
import SavedGamesList from "./SavedGamesList";
import SimulationTemplateList from "./SimulationTemplateList";
import SimulationConfiguration from "./SimulationConfiguration";

const SetupSidebar: React.FC = () => {
  const { loadSimulation, startNewGame, isSidebarCollapsed, setSidebarCollapsed, selectedTemplate } =
    useGameSetupStore();

  return (
    <ResizablePanel initialWidth={450} minWidth={450} maxWidth={900} isCollapsed={isSidebarCollapsed}>
      <Card elevation={0} className="h-full border-r" sx={{ bgcolor: "transparent", borderColor: "divider" }}>
        <CardContent className="h-full flex flex-col gap-6">
          {/* Header */}
          <Box className="flex justify-between items-center">
            <Box>
              <Typography variant="h5" className="flex items-center gap-2 font-extrabold">
                <Zap color="#facc15" size={24} />
                {CONFIG.appName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Simulation Setup & Configuration
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setSidebarCollapsed(true)} title="Collapse Sidebar">
              <ChevronLeft />
            </IconButton>
          </Box>

          {/* Saved Games List Section */}
          <SavedGamesList onLoad={loadSimulation} />

          {/* Template Selection Section */}
          <SimulationTemplateList />

          {/* Configuration Form Area */}
          <SimulationConfiguration />

          {/* Action Footer */}
          <Box className="pt-2 border-t mt-auto" sx={{ borderColor: "divider" }}>
            <Button
              fullWidth
              variant="contained"
              onClick={startNewGame}
              disabled={!selectedTemplate}
              sx={{
                fontWeight: "bold",
                borderRadius: 2,
                textTransform: "none",
              }}
              startIcon={<Zap size={18} />}
            >
              Start Simulation
            </Button>
          </Box>
        </CardContent>
      </Card>
    </ResizablePanel>
  );
};
export default SetupSidebar;
