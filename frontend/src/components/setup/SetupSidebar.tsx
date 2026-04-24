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
import { ChevronLeft, Zap, Globe, Shield, Settings2, Plus, Trash2, X, Check, Save } from "lucide-react";
import CONFIG from "@/config/appConfig";
import { Simulation, NationAddProps } from "@/types/simulation";
import ResizablePanel from "../common/ResizablePanel";
import { COUNTRY_COORDS } from "@/utils/mapUtils";
import { gameSetupService } from "@/services/gameSetupService";
import { useGameSetup } from "@/context/GameSetupContext";
import { useSimulationStore } from "@/store/useSimulationStore";
import { formatDateTime } from "@/utils/formatUtils";

interface SetupSidebarProps {
  isCollapsed: boolean;
  onStart: (sim: Simulation) => void;
  onCollapse: () => void;
  externalAddCountry?: string | null;
  onAddCountryConsumed: () => void;
}

const SetupSidebar: React.FC<SetupSidebarProps> = ({
  isCollapsed,
  onStart,
  onCollapse,
  externalAddCountry,
  onAddCountryConsumed,
}) => {
  const {
    editableName,
    editableNations,
    baseSim,
    setEditableName,
    handleTemplateSelect,
    handleTroopChange,
    handleRemoveNation,
    isInNationList,
  } = useGameSetup();

  const { savedSimulations, fetchSavedSimulations, loadSimulation, deleteSavedSimulation } = useSimulationStore();

  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSimId, setSelectedSimId] = useState<string>("");
  const [selectedSave, setSelectedSave] = useState<any | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newNation, setNewNation] = useState<NationAddProps>({ name: "", troops: 10000 });

  useEffect(() => {
    fetchSavedSimulations();
    const loadTemplates = async () => {
      setLoading(true);
      try {
        const data = await gameSetupService.getSimulationTemplates();
        setSimulations(data);
      } catch (error) {
        console.error("Failed to fetch simulation templates:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [fetchSavedSimulations]);

  useEffect(() => {
    if (externalAddCountry && !isInNationList(externalAddCountry)) {
      setIsAdding(true);
      setNewNation((prev) => ({ ...prev, name: externalAddCountry }));
      onAddCountryConsumed();
    }
  }, [externalAddCountry, onAddCountryConsumed]);

  const handleTemplateChange = (id: string) => {
    setSelectedSimId(id);
    const sim = simulations.find((s) => s.id === id);
    if (sim) {
      handleTemplateSelect(sim);
    }
  };

  const resetNewCountryAddition = () => {
    setIsAdding(false);
    setNewNation({ name: "", troops: 10000 });
  };

  const handleAddCountrySubmit = () => {
    if (newNation.name) {
      handleTroopChange(newNation.name, newNation.troops);
      resetNewCountryAddition();
    }
  };

  const handleStartClick = () => {
    if (baseSim) {
      const finalSim: Simulation = {
        ...baseSim,
        name: editableName,
        nations: editableNations,
      };
      onStart(finalSim);
    }
  };

  const labelText = loading ? "Fetching Simulations..." : "Select Simulation Template";

  return (
    <ResizablePanel initialWidth={450} minWidth={450} maxWidth={900} isCollapsed={isCollapsed}>
      <Card
        elevation={0}
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          bgcolor: "transparent",
          borderRadius: 0,
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
            <IconButton size="small" onClick={onCollapse} title="Collapse Sidebar">
              <ChevronLeft />
            </IconButton>
          </Box>

          {/* Template Selection Section */}
          <Paper
            variant="outlined"
            sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2, bgcolor: "background.default" }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
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
                {simulations.map((sim) => (
                  <MenuItem key={sim.id} value={sim.id}>
                    {sim.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>

          {/* Saved Games Dashboard Section */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              bgcolor: "background.default",
              borderStyle: "dashed",
              borderColor: "primary.main",
              maxHeight: 300,
              overflow: "hidden",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}
              >
                <Save size={16} /> Saved Games Dashboard
              </Typography>
              <Typography
                variant="caption"
                sx={{ bgcolor: "primary.main", color: "white", px: 1, borderRadius: 1, fontWeight: "bold" }}
              >
                {savedSimulations.length} Slots
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
                const { key, ...otherProps } = props as any;
                const dateStr = formatDateTime(option.timestamp);

                return (
                  <li key={option.id} {...otherProps}>
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

          {/* Configuration Form Area */}
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              gap: 3,
              overflowY: "auto",
              pr: 0,
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
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {Object.entries(editableNations).map(([nation, count]) => (
                      <Box key={nation} sx={{ display: "flex", alignItems: "center" }}>
                        <Typography variant="body2" sx={{ fontWeight: "bold", flexGrow: 1 }}>
                          {nation}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <TextField
                            size="small"
                            type="number"
                            value={count}
                            onChange={(e) => handleTroopChange(nation, Number.parseInt(e.target.value) || 0)}
                            slotProps={{
                              htmlInput: { min: 0, step: 250 },
                            }}
                            sx={{ width: 100 }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveNation(nation)}
                            color="error"
                            title={`Remove ${nation}`}
                          >
                            <Trash2 size={16} />
                          </IconButton>
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
                      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                        <TextField
                          size="small"
                          type="number"
                          label="Troops"
                          value={newNation.troops}
                          onChange={(e) =>
                            setNewNation((prev) => ({ ...prev, troops: Number.parseInt(e.target.value) || 0 }))
                          }
                          sx={{ flexGrow: 1 }}
                          slotProps={{
                            htmlInput: { min: 0, step: 250 },
                          }}
                        />
                        <Button
                          variant="contained"
                          size="small"
                          color="error"
                          onClick={resetNewCountryAddition}
                          sx={{ minWidth: 0, px: 1.5 }}
                          title="Cancel"
                        >
                          <X size={18} />
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          color="success"
                          onClick={handleAddCountrySubmit}
                          disabled={!newNation.name}
                          sx={{ minWidth: 0, px: 1.5 }}
                          title="Add Nation"
                        >
                          <Check size={18} />
                        </Button>
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
              onClick={handleStartClick}
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
