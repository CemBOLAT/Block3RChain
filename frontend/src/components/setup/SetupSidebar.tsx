import React, { useState, useEffect, startTransition } from "react";
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
import { ChevronLeft, Zap, Shield, Settings2, Plus, Trash2, Check, Save } from "lucide-react";
import CONFIG from "@/config/appConfig";
import { NationAddProps, SavedSimulation } from "@/types/simulation";
import ResizablePanel from "../common/ResizablePanel";
import { formatDateTime } from "@/utils/formatUtils";
import { COUNTRY_COORDS } from "@/utils/mapUtils";
import { useGameSetupStore } from "@/store/useGameSetupStore";

const SetupSidebar: React.FC = () => {
  const {
    templates,
    savedSimulations,
    editableName,
    editableNations,
    isLoading: loading,
    fetchTemplates,
    fetchSavedSimulations,
    handleTemplateSelect,
    setEditableName,
    updateTroopCount: handleTroopChange,
    updateGold: handleGoldChange,
    updatePopulation: handlePopChange,
    removeNation: handleRemoveNation,
    isInNationList,
    deleteSavedGame: deleteSavedSimulation,
    loadGame: loadSimulation,
    startNewGame,
    isSidebarCollapsed,
    setSidebarCollapsed,
    pendingAddCountry,
    consumePendingCountry,
  } = useGameSetupStore();

  const [selectedSimId, setSelectedSimId] = useState<string>("");
  const [selectedSave, setSelectedSave] = useState<SavedSimulation | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newNation, setNewNation] = useState<NationAddProps>({ name: "", troops: 10000, gold: 5000, population: 10 });

  useEffect(() => {
    fetchTemplates();
    fetchSavedSimulations();
  }, [fetchTemplates, fetchSavedSimulations]);

  useEffect(() => {
    if (pendingAddCountry && !isInNationList(pendingAddCountry)) {
      startTransition(() => {
        setIsAdding(true);
        setNewNation((prev) => ({ ...prev, name: pendingAddCountry }));
        consumePendingCountry();
      });
    }
  }, [pendingAddCountry, isInNationList, consumePendingCountry]);

  const handleTemplateChange = (id: string) => {
    setSelectedSimId(id);
    const sim = templates.find((s) => s.id === id);
    if (sim) {
      handleTemplateSelect(sim);
    }
  };

  const resetNewCountryAddition = () => {
    setIsAdding(false);
    setNewNation({ name: "", troops: 10000, gold: 5000, population: 10 });
  };

  const handleAddCountrySubmit = () => {
    if (newNation.name) {
      handleTroopChange(newNation.name, newNation.troops);
      handleGoldChange(newNation.name, newNation.gold);
      handlePopChange(newNation.name, newNation.population);
      resetNewCountryAddition();
    }
  };

  const labelText = loading ? "Fetching Simulations..." : "Select Simulation Template";

  return (
    <ResizablePanel initialWidth={450} minWidth={450} maxWidth={900} isCollapsed={isSidebarCollapsed}>
      <Card
        elevation={0}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          bgcolor: "transparent",
          borderRight: "1px solid",
          borderColor: "divider",
        }}
      >
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 3, height: "100%", p: 3 }}>
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
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
          <Paper
            variant="outlined"
            sx={{ p: 2, bgcolor: "background.default", display: "flex", flexDirection: "column", gap: 2 }}
          >
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}
              >
                <Save size={16} /> Saved Games Dashboard
              </Typography>
            </Box>

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
                    <Box sx={{ display: "flex", flexDirection: "column", py: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
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
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1, mb: 1 }}
            >
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
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              gap: 3,
              overflowY: "auto",
            }}
          >
            {selectedSimId && (
              <>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                    General Info
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    label="Simulation Name"
                    value={editableName}
                    onChange={(e) => setEditableName(e.target.value)}
                    variant="outlined"
                    sx={{ mt: 2 }}
                  />
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Shield size={16} /> Nation Configuration
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {Object.entries(editableNations).map(([nation, data]) => (
                      <Box key={nation} sx={{ p: 1.5, borderRadius: 1, bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                           <Typography variant="body2" sx={{ fontWeight: "bold", color: "primary.light" }}>
                            {nation}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveNation(nation)}
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
                            onChange={(e) => handleTroopChange(nation, Number.parseInt(e.target.value) || 0)}
                            slotProps={{ htmlInput: { min: 0, step: 1000 } }}
                          />
                          <TextField
                            size="small"
                            label="Gold"
                            type="number"
                            value={data.gold}
                            onChange={(e) => handleGoldChange(nation, Number.parseInt(e.target.value) || 0)}
                            slotProps={{ htmlInput: { min: 0, step: 500 } }}
                          />
                          <TextField
                            size="small"
                            label="Pop (M)"
                            type="number"
                            value={data.population}
                            onChange={(e) => handlePopChange(nation, Number.parseInt(e.target.value) || 0)}
                            slotProps={{ htmlInput: { min: 1 } }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  {!isAdding ? (
                    <Button
                      size="small"
                      startIcon={<Plus size={16} />}
                      onClick={() => setIsAdding(true)}
                      sx={{ alignSelf: "flex-end", fontWeight: "bold", textTransform: "none" }}
                    >
                      Add Country
                    </Button>
                  ) : (
                    <Box>
                      <Autocomplete
                        size="small"
                        options={Object.keys(COUNTRY_COORDS).filter((c) => !editableNations[c])}
                        value={newNation.name}
                        onChange={(_, newValue) => setNewNation((prev) => ({ ...prev, name: newValue || "" }))}
                        renderInput={(params) => <TextField {...params} label="Search Country" />}
                        fullWidth
                      />
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 2 }}>
                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
                          <TextField
                            size="small"
                            type="number"
                            label="Troops"
                            value={newNation.troops}
                            onChange={(e) =>
                              setNewNation((prev) => ({ ...prev, troops: Number.parseInt(e.target.value) || 0 }))
                            }
                            slotProps={{ htmlInput: { min: 0, step: 1000 } }}
                          />
                          <TextField
                            size="small"
                            type="number"
                            label="Gold"
                            value={newNation.gold}
                            onChange={(e) =>
                              setNewNation((prev) => ({ ...prev, gold: Number.parseInt(e.target.value) || 0 }))
                            }
                            slotProps={{ htmlInput: { min: 0, step: 500 } }}
                          />
                          <TextField
                            size="small"
                            type="number"
                            label="Pop (M)"
                            value={newNation.population}
                            onChange={(e) =>
                              setNewNation((prev) => ({ ...prev, population: Number.parseInt(e.target.value) || 0 }))
                            }
                            slotProps={{ htmlInput: { min: 1 } }}
                          />
                        </Box>
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                          <Button
                            variant="contained"
                            size="small"
                            color="error"
                            onClick={resetNewCountryAddition}
                            sx={{ minWidth: 100, fontWeight: "bold" }}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            color="success"
                            onClick={handleAddCountrySubmit}
                            disabled={!newNation.name}
                            sx={{ minWidth: 100, fontWeight: "bold" }}
                          >
                            Add
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Paper>
              </>
            )}
          </Box>

          {/* Action Footer */}
          <Box sx={{ pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
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
