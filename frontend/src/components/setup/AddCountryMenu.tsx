import React, { useState } from "react";
import { Menu, Box, Typography, TextField, Button, Divider } from "@mui/material";
import { NationAddProps } from "@/types/simulation";

interface AddCountryMenuProps {
  open: boolean;
  onClose: () => void;
  anchorPosition: { top: number; left: number } | undefined;
  countryName: string;
  onAdd: (data: NationAddProps) => void;
}

const AddCountryMenu: React.FC<AddCountryMenuProps> = ({ open, onClose, anchorPosition, countryName, onAdd }) => {
  const [formData, setFormData] = useState<NationAddProps>({
    name: countryName,
    troops: 10000,
    gold: 5000,
    population: 10,
  });

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
            borderRadius: 2,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
          },
        },
      }}
    >
      <Box className="flex flex-col gap-4 p-4 w-[20rem]">
        <Typography variant="subtitle2" className="flex items-center gap-2" sx={{ fontWeight: "bold" }}>
          Add {countryName}
        </Typography>
        <Divider />
        <Box className="grid grid-cols-3 gap-2">
          <TextField
            size="small"
            label="Troops"
            type="number"
            value={formData.troops}
            onChange={(e) => setFormData((prev) => ({ ...prev, troops: Number.parseInt(e.target.value) || 0 }))}
            slotProps={{ htmlInput: { min: 0, step: 1000 } }}
          />
          <TextField
            size="small"
            label="Gold"
            type="number"
            value={formData.gold}
            onChange={(e) => setFormData((prev) => ({ ...prev, gold: Number.parseInt(e.target.value) || 0 }))}
            slotProps={{ htmlInput: { min: 0, step: 500 } }}
          />
          <TextField
            size="small"
            label="Pop (M)"
            type="number"
            value={formData.population}
            onChange={(e) => setFormData((prev) => ({ ...prev, population: Number.parseInt(e.target.value) || 0 }))}
            slotProps={{ htmlInput: { min: 1 } }}
          />
        </Box>
        <Box className="flex gap-2 justify-end">
          <Button size="small" variant="contained" color="error" onClick={onClose} sx={{ fontWeight: "bold" }}>
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            color="success"
            onClick={() => onAdd(formData)}
            sx={{ fontWeight: "bold" }}
          >
            Add
          </Button>
        </Box>
      </Box>
    </Menu>
  );
};

export default AddCountryMenu;
