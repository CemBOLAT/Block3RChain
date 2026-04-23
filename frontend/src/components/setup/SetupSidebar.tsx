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

  const {
    savedSimulations,
    fetchSavedSimulations,
    loadSimulation
  } = useSimulationStore();

  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSimId, setSelectedSimId] = useState<string>("");
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

          {/* Load Game Section */}
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
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
              <Save size={16} /> Load Saved Game
            </Typography>
            <FormControl fullWidth size="small" disabled={savedSimulations.length === 0}>
              <InputLabel id="load-dropdown-label">
                {savedSimulations.length > 0 ? "Select Saved Simulation" : "No Saved Games Found"}
              </InputLabel>
              <Select
                labelId="load-dropdown-label"
                id="load-dropdown"
                value=""
                label={savedSimulations.length > 0 ? "Select Saved Simulation" : "No Saved Games Found"}
                onChange={(e) => {
                  const id = e.target.value as number;
                  loadSimulation(id);
                }}
              >
                {savedSimulations.map((save) => {
                  const date = new Date(save.timestamp);
                  const dateStr = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
                    .toString()
                    .padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date
                    .getMinutes()
                    .toString()
                    .padStart(2, "0")}`;
                  return (
                    <MenuItem key={save.id} value={save.id}>
                      {save.name} - {dateStr}
                    </MenuItem>
                  );
                })}
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
              pr: 1,
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
