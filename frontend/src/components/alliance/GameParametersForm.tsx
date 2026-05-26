import React from "react";
import { Box, Slider, Typography, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { ChevronDown } from "lucide-react";
import {
  CastleLevel,
  CastleParameterKey,
  CASTLE_LEVELS,
  CASTLE_PARAMETER_KEYS,
  CASTLE_LEVEL_BOUNDS,
  GameParameters,
  BLOCK_REWARD_BOUNDS,
  BLOCK_REWARD_HELP,
  HAPPINESS_LIMIT_BOUNDS,
  HAPPINESS_LIMIT_HELP,
  clampBlockReward,
  clampHappinessLimit,
  clampCastleParameter,
  formatBlockRewardValue,
  formatCastleParameterValue,
  getCastleParameterHelp,
} from "@/types/gameParameters";
import ParameterHelpTooltip from "@/components/common/ParameterHelpTooltip";
import { TOOLTIP_Z_INDEX } from "@/theme/tooltipConfig";

export interface GameParametersFormProps {
  value: GameParameters;
  onChange: (next: GameParameters) => void;
  disabled?: boolean;
}

const GameParametersForm: React.FC<GameParametersFormProps> = ({ value, onChange, disabled = false }) => {
  const handleBlockRewardChange = (displayVal: number) => {
    onChange({
      ...value,
      block_reward: clampBlockReward(displayVal * 1000),
    });
  };

  const handleHappinessLimitChange = (val: number) => {
    onChange({
      ...value,
      happiness_limit: clampHappinessLimit(val),
    });
  };

  const handleCastleChange = (level: CastleLevel, field: CastleParameterKey, displayVal: number) => {
    onChange({
      ...value,
      castles: {
        ...value.castles,
        [level]: {
          ...value.castles[level],
          [field]: clampCastleParameter(level, field, displayVal * 1000),
        },
      },
    });
  };

  const blockRewardDisplay = value.block_reward / 1000;

  return (
    <Box className="flex flex-col gap-3 px-1">
      <Accordion
        defaultExpanded
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
          sx={{ px: 2, minHeight: 44, "& .MuiAccordionSummary-content": { my: 1 } }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
            General Settings
          </Typography>
        </AccordionSummary>

        <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
          <Box className="flex flex-col gap-1">
            <Box className="flex items-center justify-between gap-2">
              <Box className="flex items-center min-w-0">
                <Typography variant="body2" sx={{ fontWeight: 500, color: "text.secondary" }}>
                  {BLOCK_REWARD_HELP.label}
                </Typography>
                <ParameterHelpTooltip label={BLOCK_REWARD_HELP.label} text={BLOCK_REWARD_HELP.tooltip} />
              </Box>

              <Typography
                variant="caption"
                color="text.primary"
                className="tabular-nums shrink-0"
                sx={{ fontWeight: 600 }}
              >
                {formatBlockRewardValue(value.block_reward)}
              </Typography>
            </Box>

            <Slider
              size="small"
              value={blockRewardDisplay}
              min={BLOCK_REWARD_BOUNDS.min / 1000}
              max={BLOCK_REWARD_BOUNDS.max / 1000}
              step={BLOCK_REWARD_BOUNDS.step / 1000}
              disabled={disabled}
              onChange={(_, v) => handleBlockRewardChange(v as number)}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => formatBlockRewardValue(v * 1000)}
              sx={{ mx: 0.5, "& .MuiSlider-valueLabel": { zIndex: TOOLTIP_Z_INDEX } }}
            />
          </Box>

          <Box className="flex flex-col gap-1">
            <Box className="flex items-center justify-between gap-2">
              <Box className="flex items-center min-w-0">
                <Typography variant="body2" sx={{ fontWeight: 500, color: "text.secondary" }}>
                  {HAPPINESS_LIMIT_HELP.label}
                </Typography>
                <ParameterHelpTooltip label={HAPPINESS_LIMIT_HELP.label} text={HAPPINESS_LIMIT_HELP.tooltip} />
              </Box>
              <Typography
                variant="caption"
                color="text.primary"
                className="tabular-nums shrink-0"
                sx={{ fontWeight: 600 }}
              >
                {value.happiness_limit}
              </Typography>
            </Box>
            <Slider
              size="small"
              value={value.happiness_limit}
              min={HAPPINESS_LIMIT_BOUNDS.min}
              max={HAPPINESS_LIMIT_BOUNDS.max}
              step={HAPPINESS_LIMIT_BOUNDS.step}
              disabled={disabled}
              onChange={(_, v) => handleHappinessLimitChange(v as number)}
              valueLabelDisplay="auto"
              sx={{ mx: 0.5, "& .MuiSlider-valueLabel": { zIndex: TOOLTIP_Z_INDEX } }}
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {CASTLE_LEVELS.map((level, idx) => (
        <Accordion
          key={level}
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
            sx={{ px: 2, minHeight: 44, "& .MuiAccordionSummary-content": { my: 1 } }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
              Level {level} Castle Settings
            </Typography>
          </AccordionSummary>

          <AccordionDetails sx={{ px: 2, pb: 2, pt: 0, display: "flex", flexDirection: "column", gap: 3.5 }}>
            {CASTLE_PARAMETER_KEYS.map((field) => {
              const { label, tooltip } = getCastleParameterHelp(level, field);
              const bounds = CASTLE_LEVEL_BOUNDS[level][field];
              const rawValue = value.castles[level][field];
              const displayValue = rawValue / 1000;

              return (
                <Box key={field} className="flex flex-col gap-1">
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
                      {formatCastleParameterValue(field, displayValue)}
                    </Typography>
                  </Box>

                  <Slider
                    size="small"
                    value={displayValue}
                    min={bounds.min / 1000}
                    max={bounds.max / 1000}
                    step={bounds.step / 1000}
                    disabled={disabled}
                    onChange={(_, v) => handleCastleChange(level, field, v as number)}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => formatCastleParameterValue(field, v)}
                    sx={{ mx: 0.5, "& .MuiSlider-valueLabel": { zIndex: TOOLTIP_Z_INDEX } }}
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
