import React from "react";
import { Box, Divider, MenuItem, Typography } from "@mui/material";
import { ACTION_GROUPS } from "@/data/interventionActions";
import type { GodInterventionType } from "@/types/map";

type GodInterventionsSectionProps = {
  isSimulationMember: boolean;
  onSelect: (type: GodInterventionType) => void;
};

const GodInterventionsSection: React.FC<GodInterventionsSectionProps> = ({
  isSimulationMember,
  onSelect,
}) => {
  if (!isSimulationMember) return null;

  return (
    <Box className="py-0.5">
      <Box className="px-4 py-1">
        <Typography
          variant="overline"
          className="!leading-none text-[10px]"
          sx={{ color: "text.secondary", fontWeight: 700 }}
        >
          God Interventions
        </Typography>
      </Box>
      {ACTION_GROUPS.map((group, groupIndex) => (
        <React.Fragment key={group.id}>
          <Box className="flex px-2 pb-1 gap-1">
            {group.actions.map((action) => {
              const Icon = action.icon;

              return (
                <MenuItem
                  key={action.type}
                  onClick={() => onSelect(action.type)}
                  sx={{
                    flex: 1,
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 1,
                    px: 0.5,
                    minHeight: 64,
                    borderRadius: 1,
                    textAlign: "center",
                  }}
                >
                  <Icon size={16} color={action.iconColor} />
                  <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.2, mt: 0.5 }}>
                    {action.label}
                  </Typography>
                  {action.secondary && (
                    <Typography variant="caption" sx={{ color: action.secondaryColor, fontSize: "0.65rem" }}>
                      {action.secondary}
                    </Typography>
                  )}
                </MenuItem>
              );
            })}
          </Box>
        </React.Fragment>
      ))}
    </Box>
  );
};

export default GodInterventionsSection;
