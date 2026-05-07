import React from "react";
import { Box, Typography, IconButton, Button, Card, CardContent } from "@mui/material";
import { ChevronLeft, Zap } from "lucide-react";
import CONFIG from "@/config/appConfig";
import ResizablePanel from "../common/ResizablePanel";
import { useGameSetupStore } from "@/store/useGameSetupStore";
import { useSimulationStore } from "@/store/useSimulationStore";
import { gameSetupService } from "@/services/gameSetupService";
import { Simulation } from "@/types/simulation";
import { toast } from "react-hot-toast";
import SavedGamesList from "./SavedGamesList";
import SimulationTemplateList from "./SimulationTemplateList";
import SimulationConfiguration from "./SimulationConfiguration";

const SetupSidebar: React.FC = () => {
  const { selectedTemplate, editableNations, isSidebarCollapsed, setSidebarCollapsed } = useGameSetupStore();
  const canStartGame = !!selectedTemplate && Object.keys(editableNations).length > 0;

  const handleLoadSimulation = async (id: number) => {
    try {
      const data = await gameSetupService.loadSimulation(id);
      useSimulationStore.getState().setSimulationId(data.simulation_id);
      toast.success("Simulation loaded!");
    } catch (e) {
      const error = e as Error;
      toast.error("Failed to load simulation: " + error.message);
    }
  };

  const handleStartNewGame = async () => {
    try {
      const simData: Simulation = {
        id: "",
        name: selectedTemplate?.name || "New Simulation",
        nations: editableNations,
      };
      const data = await gameSetupService.startSimulation(simData);
      useSimulationStore.getState().setSimulationId(data.simulation_id);
      toast.success("Simulation started!");
    } catch (e) {
      const error = e as Error;
      toast.error("Failed to start simulation: " + error.message);
    }
  };

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
          <SavedGamesList onLoad={handleLoadSimulation} />

          {/* Template Selection Section */}
          <SimulationTemplateList />

          {/* Configuration Form Area */}
          <SimulationConfiguration />

          {/* Action Footer */}
          <Box className="pt-2 border-t mt-auto" sx={{ borderColor: "divider" }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleStartNewGame}
              disabled={!canStartGame}
              className="!font-bold rounded-sm !normal-case"
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
