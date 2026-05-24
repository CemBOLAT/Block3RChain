import React, { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import AllianceParametersForm from "./AllianceParametersForm";
import GameParametersForm from "./GameParametersForm";
import { AllianceParameters } from "@/types/allianceParameters";
import { GameParameters } from "@/types/gameParameters";

export interface SimulationConfigTabsProps {
  allianceValue: AllianceParameters;
  onAllianceChange: (next: AllianceParameters) => void;
  gameValue: GameParameters;
  onGameChange: (next: GameParameters) => void;
  disabled?: boolean;
}

const SimulationConfigTabs: React.FC<SimulationConfigTabsProps> = ({
  allianceValue,
  onAllianceChange,
  gameValue,
  onGameChange,
  disabled = false,
}) => {
  const [tab, setTab] = useState(0);

  return (
    <Box className="flex flex-col gap-3">
      <Tabs
        value={tab}
        onChange={(_, nextTab) => setTab(nextTab)}
        variant="fullWidth"
        sx={{
          minHeight: 36,
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTab-root": {
            minHeight: 36,
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.8125rem",
            py: 1,
            color: "text.secondary",
            "&.Mui-selected": {
              color: "primary.main",
            },
          },
        }}
      >
        <Tab label="Alliance Settings" />
        <Tab label="Game Settings" />
      </Tabs>
      <Box className="pt-2">
        {tab === 0 ? (
          <AllianceParametersForm value={allianceValue} onChange={onAllianceChange} disabled={disabled} />
        ) : (
          <GameParametersForm value={gameValue} onChange={onGameChange} disabled={disabled} />
        )}
      </Box>
    </Box>
  );
};

export default SimulationConfigTabs;
