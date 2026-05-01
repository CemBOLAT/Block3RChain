import { Menu, MenuItem, Typography } from "@mui/material";
import { Trash2 } from "lucide-react";

interface ActiveCountryMenuProps {
  open: boolean;
  onClose: () => void;
  anchorPosition: { top: number; left: number } | undefined;
  countryName: string;
  onRemove: (name: string) => void;
}

const ActiveCountryMenu: React.FC<ActiveCountryMenuProps> = ({
  open,
  onClose,
  anchorPosition,
  countryName,
  onRemove,
}) => {
  return (
    <Menu
      open={open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition}
      slotProps={{
        paper: {
          elevation: 4,
          sx: {
            borderRadius: 1,
            minWidth: 180,
          },
        },
      }}
    >
      <MenuItem
        onClick={() => {
          onRemove(countryName);
          onClose();
        }}
        sx={{
          gap: 1.5,
          "&:hover": {
            bgcolor: "error.secondary",
          },
        }}
      >
        <Trash2 size={18} />
        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
          Remove {countryName}
        </Typography>
      </MenuItem>
    </Menu>
  );
};

export default ActiveCountryMenu;
