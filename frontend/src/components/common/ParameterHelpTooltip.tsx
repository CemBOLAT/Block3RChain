import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import { Info } from "lucide-react";
import { TOOLTIP_SLOT_PROPS } from "@/theme/tooltipConfig";

type ParameterHelpTooltipProps = {
  label: string;
  text: string;
};

const ParameterHelpTooltip: React.FC<ParameterHelpTooltipProps> = ({ label, text }) => {
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
};

export default ParameterHelpTooltip;
