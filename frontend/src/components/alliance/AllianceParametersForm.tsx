import React from "react";
import { Box, IconButton, Slider, Tooltip, Typography } from "@mui/material";
import { Info } from "lucide-react";
import {
  AllianceParameterKey,
  AllianceParameters,
  ALLIANCE_PARAMETER_BOUNDS,
  ALLIANCE_PARAMETER_HELP,
  clampAllianceParameter,
} from "@/types/allianceParameters";

const PARAMETER_KEYS: AllianceParameterKey[] = [
  "ratio_limit",
  "alpha",
  "beta",
  "epsilon_fraction",
];

const TOOLTIP_SLOT_PROPS = {
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

function formatParameterValue(key: AllianceParameterKey, v: number): string {
  if (key === "alpha" || key === "epsilon_fraction") {
    return v.toFixed(2);
  }
  return v.toFixed(1);
}

function ParameterHelpTooltip({ label, text }: { label: string; text: string }) {
  return (
    <Tooltip
      title={text}
      placement="top"
      arrow
      enterDelay={400}
      leaveDelay={80}
      slotProps={TOOLTIP_SLOT_PROPS}
    >
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

export interface AllianceParametersFormProps {
  value: AllianceParameters;
  onChange: (next: AllianceParameters) => void;
  disabled?: boolean;
}

const AllianceParametersForm: React.FC<AllianceParametersFormProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const handleSliderChange = (key: AllianceParameterKey, raw: number) => {
    onChange({
      ...value,
      [key]: clampAllianceParameter(key, raw),
    });
  };

  return (
    <Box className="flex flex-col gap-4 px-2">
      {PARAMETER_KEYS.map((key) => {
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
                {formatParameterValue(key, value[key])}
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
              valueLabelFormat={(v) => formatParameterValue(key, v)}
              sx={{ mx: 0.5 }}
            />
          </Box>
        );
      })}
    </Box>
  );
};

export default AllianceParametersForm;
