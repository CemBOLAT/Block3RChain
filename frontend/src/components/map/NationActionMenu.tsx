import React, { useState } from "react";
import { Box, Typography, TextField, Button, Popover, Divider } from "@mui/material";

interface NationActionMenuProps {
  open: boolean;
  anchorEl?: HTMLElement | null;
  anchorPosition?: { top: number; left: number };
  onClose: () => void;
  targetCountry: string;
  isMember: boolean;
  onSubmit: (data: { troops: number; gold: number; population: number }) => void;
  disabled?: boolean;
}

const NationActionMenu: React.FC<NationActionMenuProps> = ({ 
  open,
  anchorEl, 
  anchorPosition, 
  onClose, 
  targetCountry,
  isMember,
  onSubmit,
  disabled = false
}) => {
  const [troopAmount, setTroopAmount] = useState(0);
  const [goldAmount, setGoldAmount] = useState(0);
  const [popAmount, setPopAmount] = useState(0);


  const handleSubmit = () => {
    if (!targetCountry) return;
    onSubmit({
      troops: troopAmount,
      gold: goldAmount,
      population: popAmount
    });
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      anchorPosition={anchorPosition}
      onClose={onClose}
      anchorReference={anchorPosition ? "anchorPosition" : "anchorEl"}
      anchorOrigin={{
        vertical: "center",
        horizontal: "center",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
      slotProps={{
        paper: {
          elevation: 8,
          sx: {
            borderRadius: 2,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            width: "20rem",
          },
        },
      }}
    >
      <Box className="flex flex-col gap-4 p-4">
        <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
          {isMember ? `${targetCountry} Intervention` : `Add ${targetCountry}`}
        </Typography>
        
        <Divider />

        <Box className="grid grid-cols-3 gap-2">
          <TextField
            label="Troops (K)"
            size="small"
            type="number"
            value={troopAmount}
            onChange={(e) => setTroopAmount(Number(e.target.value))}
            slotProps={{ htmlInput: { min: isMember ? -1000 : 0 } }}
          />
          <TextField
            label="Gold (K)"
            size="small"
            type="number"
            value={goldAmount}
            onChange={(e) => setGoldAmount(Number(e.target.value))}
            slotProps={{ htmlInput: { min: isMember ? -1000 : 0 } }}
          />
          <TextField
            label="Pop (M)"
            size="small"
            type="number"
            value={popAmount}
            onChange={(e) => setPopAmount(Number(e.target.value))}
            slotProps={{ htmlInput: { min: isMember ? -1000 : 1 } }}
          />
        </Box>

        <Box className="flex gap-2 justify-end">
          <Button 
            size="small" 
            variant="contained" 
            color="error" 
            onClick={onClose} 
            sx={{ fontWeight: "bold" }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            color={isMember ? "primary" : "success"}
            onClick={handleSubmit}
            disabled={disabled}
            sx={{ fontWeight: "bold" }}
          >
            {isMember ? "Queue" : "Add"}
          </Button>
        </Box>
      </Box>
    </Popover>
  );
};

export default NationActionMenu;
