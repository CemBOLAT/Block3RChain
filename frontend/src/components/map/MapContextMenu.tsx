import { Menu, MenuItem, ListItemIcon, ListItemText, Divider, Box, Typography } from "@mui/material";
import { Sword, Zap, Trash2, PlusCircle, Coins, Users } from "lucide-react";
import { COUNTRY_COORDS } from "@/utils/mapUtils";
import { MapContextMenuState, GodInterventionType } from "@/types/map";


interface MapContextMenuProps {
  contextMenu: MapContextMenuState | null;
  onClose: () => void;
  onAction: (type: GodInterventionType) => void;
}

export default function MapContextMenu({ contextMenu, onClose, onAction }: MapContextMenuProps) {
  return (
    <Menu
      open={contextMenu !== null}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
      slotProps={{
        paper: {
          sx: { width: 220, bgcolor: "background.paper", border: "1px solid", borderColor: "divider" },
        },
      }}
    >
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="overline" sx={{ fontWeight: "bold", color: "primary.main" }}>
          {contextMenu?.targetName}
        </Typography>
      </Box>
      <Divider />

      {contextMenu?.isSimulationMember ? (
        <>
          <MenuItem
            onClick={() => {
              onAction("add");
              onClose();
            }}
          >
            <ListItemIcon>
              <Zap size={18} color="#facc15" />
            </ListItemIcon>
            <ListItemText primary="Bless (+5,000 Troops)" />
          </MenuItem>
          <MenuItem
            onClick={() => {
              onAction("remove");
              onClose();
            }}
          >
            <ListItemIcon>
              <Sword size={18} color="#f87171" />
            </ListItemIcon>
            <ListItemText primary="Smite (-5,000 Troops)" />
          </MenuItem>
          
          <Divider />
          
          <MenuItem
            onClick={() => {
              onAction("gold_add");
              onClose();
            }}
          >
            <ListItemIcon>
              <Coins size={18} color="#facc15" />
            </ListItemIcon>
            <ListItemText primary="Donate Gold (+10,000)" />
          </MenuItem>
          <MenuItem
            onClick={() => {
              onAction("gold_remove");
              onClose();
            }}
          >
            <ListItemIcon>
              <Coins size={18} color="#f87171" />
            </ListItemIcon>
            <ListItemText primary="Tax Gold (-10,000)" />
          </MenuItem>
          
          <Divider />
          
          <MenuItem
            onClick={() => {
              onAction("pop_add");
              onClose();
            }}
          >
            <ListItemIcon>
              <Users size={18} color="#60a5fa" />
            </ListItemIcon>
            <ListItemText primary="Invite Migrants (+5M Pop)" />
          </MenuItem>
          <MenuItem
            onClick={() => {
              onAction("pop_remove");
              onClose();
            }}
          >
            <ListItemIcon>
              <Users size={18} color="#94a3b8" />
            </ListItemIcon>
            <ListItemText primary="Deportation (-5M Pop)" />
          </MenuItem>
          
          <Divider />
          <MenuItem
            onClick={() => {
              onAction("delete");
              onClose();
            }}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon>
              <Trash2 size={18} color="#ef4444" />
            </ListItemIcon>
            <ListItemText primary="Remove Nation" />
          </MenuItem>
        </>
      ) : (
        <MenuItem
          disabled={!COUNTRY_COORDS[contextMenu?.targetName || ""]}
          onClick={() => {
            onAction("create");
            onClose();
          }}
        >
          <ListItemIcon>
            <PlusCircle size={18} color="#4ade80" />
          </ListItemIcon>
          <ListItemText primary="Add to Simulation" />
        </MenuItem>
      )}
    </Menu>
  );
}
