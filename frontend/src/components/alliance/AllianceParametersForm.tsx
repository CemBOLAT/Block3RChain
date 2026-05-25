import React from "react";
import { Box, Slider, Typography } from "@mui/material";
import {
  AllianceParameterKey,
  AllianceParameters,
  ALLIANCE_PARAMETER_BOUNDS,
  ALLIANCE_PARAMETER_HELP,
  ALLIANCE_PARAMETER_KEYS,
  clampAllianceParameter,
  formatAllianceParameterValue,
} from "@/types/allianceParameters";
import AllianceStrategySelector from "@/components/alliance/AllianceStrategySelector";
import ParameterHelpTooltip from "@/components/common/ParameterHelpTooltip";
import { TOOLTIP_Z_INDEX } from "@/theme/tooltipConfig";

export interface AllianceParametersFormProps {
  value: AllianceParameters;
  onChange: (next: AllianceParameters) => void;
  disabled?: boolean;
}

const AllianceParametersForm: React.FC<AllianceParametersFormProps> = ({ value, onChange, disabled = false }) => {
  const handleSliderChange = (key: AllianceParameterKey, raw: number) => {
    onChange({
      ...value,
      [key]: clampAllianceParameter(key, raw),
    });
  };

  return (
    <Box className="flex flex-col gap-4 px-2">
      <AllianceStrategySelector
        value={value.strategy || "balanced"}
        onChange={(strategy) => onChange({ ...value, strategy })}
        disabled={disabled}
      />

      {ALLIANCE_PARAMETER_KEYS.map((key) => {
        const { label, tooltip } = ALLIANCE_PARAMETER_HELP[key];
        const bounds = ALLIANCE_PARAMETER_BOUNDS[key];
        return (
          <Box key={key} className="flex flex-col gap-1">
            <Box className="flex items-center justify-between gap-2">
              <Box className="flex items-center min-w-0">
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {label}
                </Typography>
                <ParameterHelpTooltip label={label} text={tooltip} />
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                className="tabular-nums shrink-0"
                sx={{ fontWeight: 600 }}
              >
                {formatAllianceParameterValue(key, value[key])}
              </Typography>
            </Box>
            <Slider
              size="small"
              value={value[key]}
              min={bounds.min}
              max={bounds.max}
              step={bounds.step}
              disabled={disabled}
              onChange={(_, v) => handleSliderChange(key, v as number)}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => formatAllianceParameterValue(key, v)}
              sx={{
                mx: 0.5,
                "& .MuiSlider-valueLabel": { zIndex: TOOLTIP_Z_INDEX },
              }}
            />
          </Box>
        );
      })}
    </Box>
  );
};

export default AllianceParametersForm;
