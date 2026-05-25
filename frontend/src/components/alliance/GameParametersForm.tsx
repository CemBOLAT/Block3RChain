import React from "react";
import { Box, Slider, Typography, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { ChevronDown } from "lucide-react";
import {
  GameParameterKey,
  GameParameters,
  GAME_PARAMETER_BOUNDS,
  GAME_PARAMETER_HELP,
  clampGameParameter,
  formatGameParameterValue,
} from "@/types/gameParameters";
import ParameterHelpTooltip from "@/components/common/ParameterHelpTooltip";
import { TOOLTIP_Z_INDEX } from "@/theme/tooltipConfig";

export interface GameParametersFormProps {
  value: GameParameters;
  onChange: (next: GameParameters) => void;
  disabled?: boolean;
}

interface ParameterCategory {
  title: string;
  keys: GameParameterKey[];
}

const CATEGORIES: ParameterCategory[] = [
  {
    title: "General Settings",
    keys: ["block_reward"],
  },
  {
    title: "Level 1 Castle Settings",
    keys: ["castle_build_cost_l1", "castle_maintenance_l1", "castle_defense_l1"],
  },
  {
    title: "Level 2 Castle Settings",
    keys: ["castle_build_cost_l2", "castle_maintenance_l2", "castle_defense_l2"],
  },
  {
    title: "Level 3 Castle Settings",
    keys: ["castle_build_cost_l3", "castle_maintenance_l3", "castle_defense_l3"],
  },
];

const GameParametersForm: React.FC<GameParametersFormProps> = ({ value, onChange, disabled = false }) => {
  const handleSliderChange = (key: GameParameterKey, displayVal: number) => {
    const rawVal = displayVal * 1000;
    onChange({
      ...value,
      [key]: clampGameParameter(key, rawVal),
    });
  };

  return (
    <Box className="flex flex-col gap-3 px-1">
      {CATEGORIES.map((cat, idx) => (
        <Accordion
          key={cat.title}
          defaultExpanded={idx === 0}
          sx={{
            bgcolor: "rgba(30, 41, 59, 0.4)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            borderRadius: "8px !important",
            mb: 0.5,
            "&::before": { display: "none" },
            boxShadow: "none",
          }}
        >
          <AccordionSummary
            expandIcon={<ChevronDown size={16} />}
            sx={{
              px: 2,
              minHeight: 44,
              "& .MuiAccordionSummary-content": { my: 1 },
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
              {cat.title}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 2, pb: 2, pt: 0, display: "flex", flexDirection: "column", gap: 3.5 }}>
            {cat.keys.map((key) => {
              const { label, tooltip } = GAME_PARAMETER_HELP[key];
              const bounds = GAME_PARAMETER_BOUNDS[key];

              const displayValue = value[key] / 1000;
              const minVal = bounds.min / 1000;
              const maxVal = bounds.max / 1000;
              const stepVal = bounds.step / 1000;

              return (
                <Box key={key} className="flex flex-col gap-1">
                  <Box className="flex items-center justify-between gap-2">
                    <Box className="flex items-center min-w-0">
                      <Typography variant="body2" sx={{ fontWeight: 500, color: "text.secondary" }}>
                        {label}
                      </Typography>
                      <ParameterHelpTooltip label={label} text={tooltip} />
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.primary"
                      className="tabular-nums shrink-0"
                      sx={{ fontWeight: 600 }}
                    >
                      {formatGameParameterValue(key, displayValue)}
                    </Typography>
                  </Box>
                  <Slider
                    size="small"
                    value={displayValue}
                    min={minVal}
                    max={maxVal}
                    step={stepVal}
                    disabled={disabled}
                    onChange={(_, v) => handleSliderChange(key, v as number)}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => formatGameParameterValue(key, v)}
                    sx={{
                      mx: 0.5,
                      "& .MuiSlider-valueLabel": { zIndex: TOOLTIP_Z_INDEX },
                    }}
                  />
                </Box>
              );
            })}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default GameParametersForm;
