import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  TextField,
  Divider,
} from "@mui/material";
import CONFIG from "@/config/appConfig";
import type { Simulation } from "@/types/simulation";
import SetupSidebar from "./SetupSidebar";
import SetupMapContainer from "./SetupMapContainer";

interface GameSetupProps {
  onStart: (sim: Simulation) => void;
}

const GameSetup: React.FC<GameSetupProps> = ({ onStart }) => {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [selectedSimId, setSelectedSimId] = useState<string>("");
  const [editableName, setEditableName] = useState("");
  const [editableNations, setEditableNations] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pendingAddCountry, setPendingAddCountry] = useState<string | null>(null);

  useEffect(() => {
    // Mock service call
    const fetchSimulations = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockData: Simulation[] = [
        {
          id: "1",
          name: "Balkan Equilibrium",
          nations: {
            Turkey: 10000,
            Greece: 10000,
            Bulgaria: 10000,
            Serbia: 10000,
            Romania: 10000,
            Hungary: 10000,
          },
        },
        {
          id: "2",
          name: "Eastern Tensions",
          nations: {
            Turkey: 25000,
            Greece: 12000,
            Bulgaria: 8000,
            Russia: 40000,
          },
        },
        {
          id: "3",
          name: "Custom Crisis",
          nations: {
            Turkey: 5000,
            Syria: 15000,
            Iraq: 12000,
          },
        },
      ];

      setSimulations(mockData);
      setLoading(false);
    };

    fetchSimulations();
  }, []);

  // Update editable nations and name when selection changes
  useEffect(() => {
    const selectedSim = simulations.find((s) => s.id === selectedSimId);
    if (selectedSim) {
      setEditableName(selectedSim.name);
      setEditableNations({ ...selectedSim.nations });
    } else {
      setEditableName("");
      setEditableNations({});
    }
  }, [selectedSimId, simulations]);

  const handleTroopChange = (nation: string, count: number) => {
    setEditableNations((prev) => ({
      ...prev,
      [nation]: Math.max(0, count),
    }));
  };

  const handleRemoveNation = (nation: string) => {
    setEditableNations((prev) => {
      const next = { ...prev };
      delete next[nation];
      return next;
    });
  };

  const handleStart = () => {
    const selectedSim = simulations.find((s) => s.id === selectedSimId);
    if (selectedSim) {
      const newSim: Simulation = {
        ...selectedSim,
        name: editableName,
        nations: editableNations,
      };
      onStart(newSim);
    }
  };

  const handleCountryClick = (countryName: string) => {
    if (!editableNations[countryName]) {
      setPendingAddCountry(countryName);
      // Reset after it's picked up by the sidebar to allow re-clicks
      setTimeout(() => setPendingAddCountry(null), 100);
    }
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", bgcolor: "background.default" }}>
      <SetupSidebar
        simulations={simulations}
        selectedSimId={selectedSimId}
        editableName={editableName}
        editableNations={editableNations}
        loading={loading}
        isCollapsed={isCollapsed}
        onSelectSim={setSelectedSimId}
        onNameChange={setEditableName}
        onNationTroopChange={handleTroopChange}
        onRemoveNation={handleRemoveNation}
        onStart={handleStart}
        onCollapse={() => setIsCollapsed(true)}
        externalAddCountry={pendingAddCountry}
      />

      <SetupMapContainer
        isCollapsed={isCollapsed}
        onExpand={() => setIsCollapsed(false)}
        nations={editableNations}
        onCountryClick={handleCountryClick}
      />
    </Box>
  );
};

export default GameSetup;
