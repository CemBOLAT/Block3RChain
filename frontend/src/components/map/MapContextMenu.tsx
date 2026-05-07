import { Menu, MenuItem, ListItemIcon, ListItemText, Divider, Box, Typography } from "@mui/material";
import { Trash2 } from "lucide-react";
import { MapContextMenuState, GodInterventionType } from "@/types/map";
import React from "react";
import { ACTION_GROUPS } from "@/data/interventionActions";

interface MapContextMenuProps {
  contextMenu: MapContextMenuState | null;
  onClose: () => void;
  onAction: (type: GodInterventionType) => void;
}

export default function MapContextMenu({ contextMenu, onClose, onAction }: MapContextMenuProps) {
  const handleAction = (type: GodInterventionType) => {
    onAction(type);
    onClose();
  };

  return (
    <Menu
      open={contextMenu !== null}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
      slotProps={{
        paper: {
          elevation: 8,
          sx: {
            width: 240,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          },
        },
      }}
    >
      <Box className="px-4 py-3">
        <Typography
          variant="caption"
          className="block !font-extrabold"
          sx={{
            color: "primary.main",
            textTransform: "uppercase",
            letterSpacing: 1.2,
          }}
        >
          {contextMenu?.targetName}
        </Typography>
        <Typography variant="overline" className="!leading-none" sx={{ color: "text.secondary" }}>
          God Interventions
        </Typography>
      </Box>

      <Divider />

      {contextMenu?.isSimulationMember && (
        <Box className="py-1">
          {ACTION_GROUPS.map((group, groupIndex) => (
            <React.Fragment key={group.id}>
              {groupIndex > 0 && <Divider className="!my-1" />}
              {group.actions.map((action) => {
                const Icon = action.icon;

                return (
                  <MenuItem key={action.type} onClick={() => handleAction(action.type)}>
                    <ListItemIcon>
                      <Icon size={18} color={action.iconColor} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" className="!font-bold">
                          {action.label}
                        </Typography>
                      }
                      {...(action.secondary && {
                        secondary: (
                          <Typography variant="caption" sx={{ color: action.secondaryColor }}>
                            {action.secondary}
                          </Typography>
                        ),
                      })}
                    />
                  </MenuItem>
                );
              })}
            </React.Fragment>
          ))}

          <Divider className="!my-1" />

          <MenuItem
            onClick={() => handleAction("delete")}
            sx={{
              color: "error.main",
            }}
          >
            <ListItemIcon>
              <Trash2 size={18} color="#ef4444" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  Remove Nation
                </Typography>
              }
            />
          </MenuItem>
        </Box>
      )}
    </Menu>
  );
}
