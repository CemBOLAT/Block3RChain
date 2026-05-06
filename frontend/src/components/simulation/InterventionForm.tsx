import React, { useState, useMemo } from "react";
import { Box, Typography, TextField, Button, Paper, Autocomplete } from "@mui/material";
import { Zap } from "lucide-react";
import { useSimulationStore } from "@/store/useSimulationStore";
import { toBackendUnits } from "@/utils/formatUtils";

const InterventionForm: React.FC = () => {
  const { step, ledger, triggerGodIntervention } = useSimulationStore();
  
  const [selectedCountry, setSelectedCountry] = useState("");
  const [troopAmount, setTroopAmount] = useState(0);
  const [goldAmount, setGoldAmount] = useState(0);
  const [popAmount, setPopAmount] = useState(0);

  const simulationCountries = useMemo(() => Object.keys(ledger), [ledger]);

  const handleIntervention = () => {
    if (!selectedCountry) return;
    
    triggerGodIntervention(selectedCountry, {
      troopChange: toBackendUnits(troopAmount),
      goldChange: toBackendUnits(goldAmount),
      popChange: popAmount,
    });

    // Reset inputs
    setTroopAmount(0);
    setGoldAmount(0);
    setPopAmount(0);
  };

  return (
    <Paper variant="outlined" className="flex flex-col gap-4 p-4" sx={{ bgcolor: "background.default" }}>
      <Typography variant="subtitle2" className="!font-bold">
        Exogenous Shock
      </Typography>

      <Autocomplete
        size="small"
        options={simulationCountries}
        value={selectedCountry && simulationCountries.includes(selectedCountry) ? selectedCountry : null}
        onChange={(_, newValue) => setSelectedCountry(newValue || "")}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={
              simulationCountries.length > 0 ? "Search country in ledger..." : "Waiting for simulation..."
            }
          />
        )}
        disabled={simulationCountries.length === 0}
      />

      <Box className="grid grid-cols-3 gap-2">
        <TextField
          label="Troops (K)"
          fullWidth
          size="small"
          type="number"
          value={troopAmount}
          onChange={(e) => setTroopAmount(Number(e.target.value))}
        />
        <TextField
          label="Gold (K)"
          fullWidth
          size="small"
          type="number"
          value={goldAmount}
          onChange={(e) => setGoldAmount(Number(e.target.value))}
        />
        <TextField
          label="Pop (M)"
          fullWidth
          size="small"
          type="number"
          value={popAmount}
          onChange={(e) => setPopAmount(Number(e.target.value))}
        />
      </Box>
      <Button
        fullWidth
        variant="contained"
        color="primary"
        className="!font-bold"
        onClick={handleIntervention}
        disabled={step !== 0 || !selectedCountry}
        startIcon={<Zap size={16} />}
      >
        Queue Intervention
      </Button>
    </Paper>
  );
};

export default InterventionForm;
