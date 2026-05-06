import React, { useState, useEffect } from "react";
import { Box, Typography, TextField, Button, Paper, Autocomplete } from "@mui/material";
import { Trash2, Check, Save } from "lucide-react";
import { SavedSimulation } from "@/types/simulation";
import { formatDateTime } from "@/utils/formatUtils";
import { useGameSetupStore } from "@/store/useGameSetupStore";

interface SavedGamesListProps {
  onLoad: (id: number) => void;
}

const SavedGamesList: React.FC<SavedGamesListProps> = ({ onLoad }) => {
  const { savedSimulations, deleteSavedSimulation, fetchSavedSimulations } = useGameSetupStore();

  useEffect(() => {
    fetchSavedSimulations();
  }, [fetchSavedSimulations]);

  const [selectedSave, setSelectedSave] = useState<SavedSimulation | null>(null);

  return (
    <Paper variant="outlined" className="flex flex-col gap-3 p-4" sx={{ bgcolor: "background.default" }}>
      <Typography variant="subtitle2" className="flex items-center gap-2 font-bold">
        <Save size={16} /> Saved Games
      </Typography>

      <Autocomplete
        size="small"
        options={[...savedSimulations].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )}
        getOptionLabel={(option) => option.name}
        value={selectedSave}
        onChange={(_, newValue) => setSelectedSave(newValue)}
        renderInput={(params) => (
          <TextField {...params} placeholder="Search saved simulations..." sx={{ bgcolor: "background.paper" }} />
        )}
        renderOption={(props, option) => {
          const dateStr = formatDateTime(option.timestamp);

          return (
            <li {...props} key={option.id}>
              <Box className="flex justify-between items-center w-full">
                <Typography variant="body2" className="font-bold">
                  {option.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {dateStr}
                </Typography>
              </Box>
            </li>
          );
        }}
        noOptionsText="No saved games found"
      />

      {selectedSave && (
        <Box className="flex gap-2">
          <Button
            fullWidth
            size="small"
            variant="contained"
            color="error"
            startIcon={<Trash2 size={16} />}
            onClick={() => {
              deleteSavedSimulation(selectedSave.id);
              setSelectedSave(null);
            }}
            sx={{ fontWeight: "bold", textTransform: "none" }}
          >
            Delete
          </Button>
          <Button
            fullWidth
            size="small"
            variant="contained"
            color="primary"
            startIcon={<Check size={16} />}
            onClick={() => onLoad(selectedSave.id)}
            sx={{ fontWeight: "bold", textTransform: "none" }}
          >
            Load
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default SavedGamesList;
