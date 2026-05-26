import React from "react";
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from "@mui/material";
import { ChevronDown, Shield, Settings } from "lucide-react";
import { useGameSetupStore } from "@/store/useGameSetupStore";
import SimulationConfigTabs from "@/components/alliance/SimulationConfigTabs";
import NationConfiguration from "@/components/setup/NationConfiguration";

const sectionAccordionSx = {
  bgcolor: "background.paper",
  border: 1,
  borderColor: "divider",
  borderRadius: "4px !important",
  "&::before": { display: "none" },
  boxShadow: "none",
};

const SimulationConfiguration: React.FC = () => {
  const {
    selectedTemplate,
    editableNations,
    allianceParameters,
    setAllianceParameters,
    gameParameters,
    setGameParameters,
    updateNation,
    addRival,
    removeRival,
    removeNation,
  } = useGameSetupStore();

  if (!selectedTemplate) return null;

  return (
    <Box className="grow flex flex-col gap-3 overflow-y-auto">
      <Accordion defaultExpanded disableGutters elevation={0} sx={sectionAccordionSx}>
        <AccordionSummary
          expandIcon={<ChevronDown size={16} />}
          sx={{ px: 2, minHeight: 48, "& .MuiAccordionSummary-content": { my: 1 } }}
        >
          <Typography variant="subtitle2" className="flex items-center gap-2">
            <Shield size={16} /> Nation Configuration
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
          <Box className="flex flex-col gap-4">
            {Object.entries(editableNations).map(([nation, data]) => (
              <NationConfiguration
                key={nation}
                nation={nation}
                data={data}
                allNationNames={Object.keys(editableNations)}
                onUpdate={(patch) => updateNation(nation, patch)}
                onAddRival={(rivalName) => addRival(nation, rivalName)}
                onRemoveRival={(rivalName) => removeRival(nation, rivalName)}
                onRemove={() => removeNation(nation)}
              />
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded disableGutters elevation={0} sx={sectionAccordionSx}>
        <AccordionSummary
          expandIcon={<ChevronDown size={16} />}
          sx={{ px: 2, minHeight: 48, "& .MuiAccordionSummary-content": { my: 1 } }}
        >
          <Typography variant="subtitle2" className="flex items-center gap-2">
            <Settings size={16} /> Game & Alliance Parameters
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
          <SimulationConfigTabs
            allianceParameters={allianceParameters}
            onAllianceParametersChange={setAllianceParameters}
            gameParameters={gameParameters}
            onGameParametersChange={setGameParameters}
          />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default SimulationConfiguration;
