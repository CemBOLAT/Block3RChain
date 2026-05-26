import React, { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  TextField,
  IconButton,
  Popover,
  List,
  ListItemButton,
  ListItemText,
  Chip,
} from "@mui/material";
import { ChevronDown, Trash2, Plus } from "lucide-react";
import { fromBackendUnits, toBackendUnits } from "@/utils/formatUtils";
import type { NationConfig } from "@/types/simulation";

type NationConfigurationProps = {
  nation: string;
  data: NationConfig;
  allNationNames: string[];
  onUpdate: (data: Partial<Pick<NationConfig, "troops" | "gold" | "population" | "happiness">>) => void;
  onAddRival: (rivalName: string) => void;
  onRemoveRival: (rivalName: string) => void;
  onRemove: () => void;
};

const NationConfiguration: React.FC<NationConfigurationProps> = ({
  nation,
  data,
  allNationNames,
  onUpdate,
  onAddRival,
  onRemoveRival,
  onRemove,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const availableRivals = allNationNames.filter((n) => n !== nation && !data.rivals.includes(n));

  const handleAddRival = (rivalName: string) => {
    onAddRival(rivalName);
  };

  return (
    <Accordion
      defaultExpanded
      disableGutters
      elevation={0}
      className="border rounded-sm"
      sx={{
        bgcolor: "action.hover",
        borderColor: "divider",
        "&::before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<ChevronDown size={16} />}
        className="px-3 pt-3"
        sx={{
          minHeight: "unset",
          my: 1,
          "& .MuiAccordionSummary-content": { my: 0, mr: 1 },
          "& .MuiAccordionSummary-expandIconWrapper": { color: "text.secondary" },
        }}
      >
        <Box className="flex justify-between items-center w-full">
          <Typography variant="body2" className="!font-bold" sx={{ color: "primary.light" }}>
            {nation}
          </Typography>
          <IconButton
            component="span"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            color="error"
            title={`Remove ${nation}`}
          >
            <Trash2 size={16} />
          </IconButton>
        </Box>
      </AccordionSummary>

      <AccordionDetails className="p-3 pt-0">
        <Box className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <TextField
            size="small"
            label="Troops (K)"
            type="number"
            value={fromBackendUnits(data.troops)}
            onChange={(e) => onUpdate({ troops: toBackendUnits(Number.parseInt(e.target.value) || 0) })}
            slotProps={{ htmlInput: { min: 0 } }}
          />
          <TextField
            size="small"
            label="Gold (K)"
            type="number"
            value={fromBackendUnits(data.gold)}
            onChange={(e) => onUpdate({ gold: toBackendUnits(Number.parseInt(e.target.value) || 0) })}
            slotProps={{ htmlInput: { min: 0 } }}
          />
          <TextField
            size="small"
            label="Pop (M)"
            type="number"
            value={data.population}
            onChange={(e) => onUpdate({ population: Number.parseInt(e.target.value) || 0 })}
            slotProps={{ htmlInput: { min: 0 } }}
          />
          <TextField
            size="small"
            label="Happiness (%)"
            type="number"
            value={data.happiness}
            onChange={(e) =>
              onUpdate({
                happiness: Math.min(100, Math.max(0, Number.parseInt(e.target.value) || 0)),
              })
            }
            slotProps={{ htmlInput: { min: 0, max: 100 } }}
          />
        </Box>

        <Box className="mt-3 pt-3 border-t" sx={{ borderColor: "divider" }}>
          <Box className="flex justify-between items-center mb-2">
            <Typography variant="caption" className="!font-bold" sx={{ color: "text.secondary" }}>
              Rivals List of {nation}
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => setAnchorEl(e.currentTarget)}
              disabled={availableRivals.length === 0}
              title="Add rival"
            >
              <Plus size={16} />
            </IconButton>
          </Box>

          {data.rivals.length === 0 ? (
            <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>
              No rivals configured
            </Typography>
          ) : (
            <Box className="flex flex-wrap gap-1">
              {data.rivals.map((rival) => (
                <Chip
                  key={rival}
                  label={rival}
                  size="small"
                  onDelete={() => onRemoveRival(rival)}
                  sx={{ fontSize: "0.7rem", height: 22 }}
                />
              ))}
            </Box>
          )}

          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <List dense sx={{ minWidth: 160, maxHeight: 200, overflow: "auto" }}>
              {availableRivals.length === 0 ? (
                <ListItemText
                  primary="No countries available"
                  sx={{ px: 2, py: 1, fontSize: "0.75rem", color: "text.secondary" }}
                />
              ) : (
                availableRivals.map((rival) => (
                  <ListItemButton key={rival} onClick={() => handleAddRival(rival)}>
                    <ListItemText primary={rival} />
                  </ListItemButton>
                ))
              )}
            </List>
          </Popover>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default NationConfiguration;
