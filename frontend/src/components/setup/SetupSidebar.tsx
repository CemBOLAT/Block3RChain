import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  TextField,
  Divider,
  Button,
  Card,
  CardContent,
  Paper,
  Autocomplete,
} from "@mui/material";
import { ChevronLeft, Zap, Shield, Settings2, Trash2, Check, Save } from "lucide-react";
import CONFIG from "@/config/appConfig";
import { SavedSimulation } from "@/types/simulation";
import ResizablePanel from "../common/ResizablePanel";
import { formatDateTime } from "@/utils/formatUtils";
import { useGameSetupStore } from "@/store/useGameSetupStore";

const SetupSidebar: React.FC = () => {
  const {
    templates,
    savedSimulations,
    editableNations,
    isLoading: loading,
    fetchTemplates,
    fetchSavedSimulations,
    handleTemplateSelect,
    updateNation,
    removeNation,
    deleteSavedGame: deleteSavedSimulation,
    loadGame: loadSimulation,
    startNewGame,
    isSidebarCollapsed,
    setSidebarCollapsed,
  } = useGameSetupStore();

  const [selectedSimId, setSelectedSimId] = useState<string>("");
  const [selectedSave, setSelectedSave] = useState<SavedSimulation | null>(null);

  useEffect(() => {
    fetchTemplates();
    fetchSavedSimulations();
  }, [fetchTemplates, fetchSavedSimulations]);

  const handleTemplateChange = (id: string) => {
    setSelectedSimId(id);
    const sim = templates.find((s) => s.id === id);
    if (sim) {
      handleTemplateSelect(sim);
    }
  };

  const labelText = loading ? "Fetching Simulations..." : "Select Simulation Template";

  return (
    <ResizablePanel initialWidth={450} minWidth={450} maxWidth={900} isCollapsed={isSidebarCollapsed}>
      <Card elevation={0} className="h-full border-r" sx={{ bgcolor: "transparent", borderColor: "divider" }}>
        <CardContent className="h-full flex flex-col gap-6">
          {/* Header */}
          <Box className="flex justify-between items-center">
            <Box>
              <Typography variant="h5" className="flex items-center gap-2 font-extrabold">
                <Zap color="#facc15" size={24} />
                {CONFIG.appName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Simulation Setup & Configuration
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setSidebarCollapsed(true)} title="Collapse Sidebar">
              <ChevronLeft />
            </IconButton>
          </Box>

          {/* Saved Games Dashboard Section */}
          <Paper variant="outlined" className="flex flex-col gap-3 p-4" sx={{ bgcolor: "background.default" }}>
            <Typography variant="subtitle2" className="flex items-center gap-2 font-bold">
              <Save size={16} /> Saved Games
            </Typography>

            <Autocomplete
              size="small"
              options={savedSimulations.sort(
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
              <Box sx={{ display: "flex", gap: 1 }}>
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
                  onClick={() => loadSimulation(selectedSave.id)}
                  sx={{ fontWeight: "bold", textTransform: "none" }}
                >
                  Load
                </Button>
              </Box>
            )}
          </Paper>

          {/* Template Selection Section */}
          <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
            <Typography variant="subtitle2" className="font-bold flex items-center gap-2 pb-2">
              <Settings2 size={16} /> Choose Template
            </Typography>
            <FormControl fullWidth disabled={loading} size="small">
              <InputLabel id="setup-dropdown-label">{labelText}</InputLabel>
              <Select
                labelId="setup-dropdown-label"
                id="setup-dropdown"
                value={selectedSimId}
                label={labelText}
                onChange={(e) => handleTemplateChange(e.target.value)}
                IconComponent={loading ? () => <CircularProgress size={20} sx={{ mr: 2, mt: 0.5 }} /> : undefined}
              >
                {templates.map((sim) => (
                  <MenuItem key={sim.id} value={sim.id}>
                    {sim.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>

          {/* Configuration Form Area */}
          {selectedSimId && (
            <Box className="grow flex flex-col gap-3 overflow-y-auto">
              <>
                <Paper variant="outlined" className="flex flex-col gap-4 p-4">
                  <Typography variant="subtitle2" className="flex items-center gap-2">
                    <Shield size={16} /> Nation Configuration
                  </Typography>
                  <Box className="flex flex-col gap-4">
                    {Object.entries(editableNations).map(([nation, data]) => (
                      <Box
                        key={nation}
                        className="border rounded-sm p-3"
                        sx={{ bgcolor: "action.hover", borderColor: "divider" }}
                      >
                        <Box className="flex justify-between items-center mb-3">
                          <Typography variant="body2" sx={{ fontWeight: "bold", color: "primary.light" }}>
                            {nation}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => removeNation(nation)}
                            color="error"
                            title={`Remove ${nation}`}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </Box>

                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
                          <TextField
                            size="small"
                            label="Troops"
                            type="number"
                            value={data.troops}
                            onChange={(e) => updateNation(nation, { troops: Number.parseInt(e.target.value) || 0 })}
                            slotProps={{ htmlInput: { min: 0, step: 1000 } }}
                          />
                          <TextField
                            size="small"
                            label="Gold"
                            type="number"
                            value={data.gold}
                            onChange={(e) => updateNation(nation, { gold: Number.parseInt(e.target.value) || 0 })}
                            slotProps={{ htmlInput: { min: 0, step: 500 } }}
                          />
                          <TextField
                            size="small"
                            label="Pop (M)"
                            type="number"
                            value={data.population}
                            onChange={(e) => updateNation(nation, { population: Number.parseInt(e.target.value) || 0 })}
                            slotProps={{ htmlInput: { min: 1 } }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  <Divider sx={{ my: 1 }} />
                </Paper>
              </>
            </Box>
          )}

          {/* Action Footer */}
          <Box className="pt-2 border-t" sx={{ borderColor: "divider" }}>
            <Button
              fullWidth
              variant="contained"
              onClick={startNewGame}
              disabled={!selectedSimId || loading}
              sx={{
                fontWeight: "bold",
                borderRadius: 2,
                textTransform: "none",
              }}
              startIcon={<Zap size={18} />}
            >
              Start Simulation
            </Button>
          </Box>
        </CardContent>
      </Card>
    </ResizablePanel>
  );
};
export default SetupSidebar;
