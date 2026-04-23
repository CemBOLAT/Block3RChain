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
import { GameSetupProvider } from "@/context/GameSetupContext";

interface GameSetupProps {
  onStart: (sim: Simulation) => void;
}

const GameSetup: React.FC<GameSetupProps> = ({ onStart }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pendingAddCountry, setPendingAddCountry] = useState<string | null>(null);

  const handleCountryClick = (countryName: string) => {
    setPendingAddCountry(countryName);
    setIsCollapsed(false);
  };

  return (
    <GameSetupProvider>
      <Box sx={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", bgcolor: "background.default" }}>
        <SetupSidebar
          isCollapsed={isCollapsed}
          onStart={onStart}
          onCollapse={() => setIsCollapsed(true)}
          externalAddCountry={pendingAddCountry}
          onAddCountryConsumed={() => setPendingAddCountry(null)}
        />

        <SetupMapContainer
          isCollapsed={isCollapsed}
          onExpand={() => setIsCollapsed(false)}
          onCountryClick={handleCountryClick}
        />
      </Box>
    </GameSetupProvider>
  );
};

export default GameSetup;
