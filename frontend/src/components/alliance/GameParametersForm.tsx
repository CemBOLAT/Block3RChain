import React from "react";
import { Box, IconButton, Slider, Tooltip, Typography, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { ChevronDown, Info } from "lucide-react";
import {
  GameParameterKey,
  GameParameters,
  GAME_PARAMETER_BOUNDS,
  GAME_PARAMETER_HELP,
  clampGameParameter,
} from "@/types/gameParameters";

const TOOLTIP_Z_INDEX = 10_000;

const TOOLTIP_SLOT_PROPS = {
  popper: { sx: { zIndex: TOOLTIP_Z_INDEX } },
  tooltip: {
    sx: {
      maxWidth: 272,
      px: 1.5,
      py: 1.25,
      bgcolor: "background.paper",
      color: "text.secondary",
      border: "1px solid",
      borderColor: "divider",
      boxShadow: 6,
      typography: "caption",
      lineHeight: 1.55,
    },
  },
  arrow: {
    sx: {
      color: "background.paper",
      "&::before": {
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
        boxSizing: "border-box",
      },
    },
  },
} as const;

function formatParameterValue(key: GameParameterKey, v: number): string {
  if (v === 0) return "0";
  if (key.includes("cost") || key.includes("maintenance")) {
    return `${v}K 💰`;
  }
  return `${v}K`;
}

function ParameterHelpTooltip({ label, text }: { label: string; text: string }) {
  return (
    <Tooltip title={text} placement="top" arrow enterDelay={400} leaveDelay={80} slotProps={TOOLTIP_SLOT_PROPS}>
      <IconButton
        component="span"
        size="small"
        aria-label={`About ${label}`}
        sx={{
          p: 0.25,
          ml: 0.25,
          verticalAlign: "middle",
          color: "text.disabled",
          "&:hover": {
            color: "primary.light",
            bgcolor: "action.hover",
          },
        }}
      >
        <Info size={14} strokeWidth={2} />
      </IconButton>
    </Tooltip>
  );
}

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

const GameParametersForm: React.FC<GameParametersFormProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
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
                      {formatParameterValue(key, displayValue)}
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
                    valueLabelFormat={(v) => formatParameterValue(key, v)}
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
