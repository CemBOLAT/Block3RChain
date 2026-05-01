import { Menu, MenuItem, ListItemIcon, ListItemText, Divider, Box, Typography } from "@mui/material";
import { Sword, Zap, Trash2, Coins, Users } from "lucide-react";
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
          elevation: 8,
          sx: { 
            width: 240, 
            bgcolor: "background.paper", 
            border: "1px solid", 
            borderColor: "divider",
            borderRadius: 2,
            mt: 0.5,
          },
        },
      }}
    >
      <Box sx={{ px: 2, py: 1.5, bgcolor: "action.hover" }}>
        <Typography 
          variant="caption" 
          sx={{ 
            fontWeight: 800, 
            color: "primary.main", 
            textTransform: "uppercase",
            letterSpacing: 1.2,
            display: "block"
          }}
        >
          {contextMenu?.targetName}
        </Typography>
        <Typography variant="overline" sx={{ fontSize: "0.65rem", color: "text.secondary", lineHeight: 1 }}>
          God Interventions
        </Typography>
      </Box>
      <Divider sx={{ mb: 0.5 }} />

      {contextMenu?.isSimulationMember && (
        <Box sx={{ py: 0.5 }}>
          <MenuItem
            onClick={() => {
              onAction("add");
              onClose();
            }}
            sx={{ py: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Zap size={18} color="#facc15" />
            </ListItemIcon>
            <ListItemText 
              primary={<Typography variant="body2" sx={{ fontWeight: "bold" }}>Bless Nation</Typography>}
              secondary={<Typography variant="caption" sx={{ color: "success.main" }}>+5,000 Troops</Typography>}
            />
          </MenuItem>
          <MenuItem
            onClick={() => {
              onAction("remove");
              onClose();
            }}
            sx={{ py: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Sword size={18} color="#f87171" />
            </ListItemIcon>
            <ListItemText 
              primary={<Typography variant="body2" sx={{ fontWeight: "bold" }}>Smite Nation</Typography>}
              secondary={<Typography variant="caption" sx={{ color: "error.main" }}>-5,000 Troops</Typography>}
            />
          </MenuItem>

          <Divider sx={{ my: 0.5 }} />

          <MenuItem
            onClick={() => {
              onAction("gold_add");
              onClose();
            }}
            sx={{ py: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Coins size={18} color="#facc15" />
            </ListItemIcon>
            <ListItemText 
              primary={<Typography variant="body2" sx={{ fontWeight: "bold" }}>Donate Gold</Typography>}
              secondary={<Typography variant="caption" sx={{ color: "warning.main" }}>+10,000 Gold</Typography>}
            />
          </MenuItem>
          <MenuItem
            onClick={() => {
              onAction("gold_remove");
              onClose();
            }}
            sx={{ py: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Coins size={18} color="#f87171" />
            </ListItemIcon>
            <ListItemText 
              primary={<Typography variant="body2" sx={{ fontWeight: "bold" }}>Tax Nation</Typography>}
              secondary={<Typography variant="caption" sx={{ color: "error.light" }}>-10,000 Gold</Typography>}
            />
          </MenuItem>

          <Divider sx={{ my: 0.5 }} />

          <MenuItem
            onClick={() => {
              onAction("pop_add");
              onClose();
            }}
            sx={{ py: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Users size={18} color="#60a5fa" />
            </ListItemIcon>
            <ListItemText 
              primary={<Typography variant="body2" sx={{ fontWeight: "bold" }}>Invite Migrants</Typography>}
              secondary={<Typography variant="caption" sx={{ color: "info.main" }}>+5M Population</Typography>}
            />
          </MenuItem>
          <MenuItem
            onClick={() => {
              onAction("pop_remove");
              onClose();
            }}
            sx={{ py: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Users size={18} color="#94a3b8" />
            </ListItemIcon>
            <ListItemText 
              primary={<Typography variant="body2" sx={{ fontWeight: "bold" }}>Deportation</Typography>}
              secondary={<Typography variant="caption" sx={{ color: "text.secondary" }}>-5M Population</Typography>}
            />
          </MenuItem>

          <Divider sx={{ my: 0.5 }} />
          <MenuItem
            onClick={() => {
              onAction("delete");
              onClose();
            }}
            sx={{ 
              py: 1,
              color: "error.main",
              "&:hover": { bgcolor: "error.soft" }
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Trash2 size={18} color="#ef4444" />
            </ListItemIcon>
            <ListItemText 
              primary={<Typography variant="body2" sx={{ fontWeight: "bold" }}>Remove Nation</Typography>}
            />
          </MenuItem>
        </Box>
      )}
    </Menu>
  );
}
