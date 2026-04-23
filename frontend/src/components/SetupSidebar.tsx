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
import { ChevronLeft, Zap, Globe, Shield, Settings2, Plus, Trash2 } from "lucide-react";
import CONFIG from "@/config/appConfig";
import { Simulation } from "@/types/simulation";
import ResizablePanel from "./ResizablePanel";
import { COUNTRY_COORDS } from "@/utils/mapUtils";

interface SetupSidebarProps {
  simulations: Simulation[];
  selectedSimId: string;
  editableName: string;
  editableNations: Record<string, number>;
  loading: boolean;
  isCollapsed: boolean;
  onSelectSim: (id: string) => void;
  onNameChange: (name: string) => void;
  onNationTroopChange: (nation: string, count: number) => void;
  onRemoveNation: (nation: string) => void;
  onStart: () => void;
  onCollapse: () => void;
  externalAddCountry?: string | null;
}

const SetupSidebar: React.FC<SetupSidebarProps> = ({
  simulations,
  selectedSimId,
  editableName,
  editableNations,
  loading,
  isCollapsed,
  onSelectSim,
  onNameChange,
  onNationTroopChange,
  onRemoveNation,
  onStart,
  onCollapse,
  externalAddCountry,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newCountryName, setNewCountryName] = useState("");
  const [newCountryTroops, setNewCountryTroops] = useState(10000);

  // Sync with external add request (e.g. from map click)
  useEffect(() => {
    if (externalAddCountry) {
      setIsAdding(true);
      setNewCountryName(externalAddCountry);
    }
  }, [externalAddCountry]);

  const handleTemplateChange = (id: string) => {
    onSelectSim(id);
  };

  const handleSimulationNameChange = (name: string) => {
    onNameChange(name);
  };

  const handleNationTroopChange = (nation: string, value: string) => {
    const count = parseInt(value) || 0;
    onNationTroopChange(nation, count);
  };

  const handleRemoveNationClick = (nation: string) => {
    onRemoveNation(nation);
  };

  const handleNewCountryTroopsChange = (value: string) => {
    const count = parseInt(value) || 0;
    setNewCountryTroops(count);
  };

  const handleAddCountryClick = () => {
    setIsAdding(true);
  };

  const handleAddCountryCancel = () => {
    setIsAdding(false);
    setNewCountryName("");
    setNewCountryTroops(10000);
  };

  const handleAddCountrySubmit = () => {
    if (newCountryName) {
      onNationTroopChange(newCountryName, newCountryTroops);
      setIsAdding(false);
      setNewCountryName("");
      setNewCountryTroops(10000);
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

          {/* Configuration Form Area */}
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              gap: 3,
              overflowY: "auto",
              pr: 1,
              "&::-webkit-scrollbar": { width: "8px" },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "rgba(0,0,0,0.1)",
                borderRadius: "4px",
              },
            }}
          >
            {selectedSimId && (
              <>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2, bgcolor: "background.default" }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                    General Info
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    label="Simulation Name"
                    value={editableName}
                    onChange={(e) => handleSimulationNameChange(e.target.value)}
                    variant="outlined"
                  />
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2, borderStyle: "dashed" }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Shield size={16} /> Nation Configuration
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {Object.entries(editableNations).map(([nation, count]) => (
                      <Box key={nation} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" sx={{ fontWeight: "medium", color: "primary.light" }}>
                          {nation}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <TextField
                            size="small"
                            type="number"
                            value={count}
                            onChange={(e) => handleNationTroopChange(nation, e.target.value)}
                            slotProps={{
                              htmlInput: { min: 0, step: 250, style: { fontFamily: "monospace", textAlign: "right" } },
                            }}
                            sx={{ width: 100 }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveNationClick(nation)}
                            sx={{ color: "error.main" }}
                            title={`Remove ${nation}`}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  <Divider sx={{ my: 1, borderStyle: "dashed" }} />

                  {!isAdding ? (
                    <Button
                      size="small"
                      startIcon={<Plus size={16} />}
                      onClick={handleAddCountryClick}
                      sx={{ alignSelf: "flex-start", fontWeight: "bold", textTransform: "none" }}
                    >
                      Add Country
                    </Button>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                      <Autocomplete
                        size="small"
                        options={Object.keys(COUNTRY_COORDS).filter((c) => !editableNations[c])}
                        value={newCountryName}
                        onChange={(_, newValue) => setNewCountryName(newValue || "")}
                        renderInput={(params) => <TextField {...params} label="Search Country" />}
                        fullWidth
                      />
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <TextField
                          size="small"
                          type="number"
                          label="Troops"
                          value={newCountryTroops}
                          onChange={(e) => handleNewCountryTroopsChange(e.target.value)}
                          sx={{ flexGrow: 1 }}
                          slotProps={{
                            htmlInput: { min: 0, step: 250 },
                          }}
                        />
                        <Button
                          variant="contained"
                          size="small"
                          onClick={handleAddCountrySubmit}
                          disabled={!newCountryName}
                          sx={{ fontWeight: "bold" }}
                        >
                          Add
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={handleAddCountryCancel}
                          sx={{ fontWeight: "bold" }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Paper>
              </>
            )}
          </Box>

          {/* Action Footer */}
          <Box sx={{ display: "flex", gap: 2, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
            <Button
              fullWidth
              variant="outlined"
              sx={{
                py: 1,
                fontWeight: "bold",
                borderRadius: 2,
                textTransform: "none",
              }}
              startIcon={<Plus size={18} />}
            >
              Custom
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={onStart}
              disabled={!selectedSimId || loading}
              sx={{
                py: 1,
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
