"use client";

import { useState } from "react";
import { useSimulationStore } from "@/store/useSimulationStore";
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Divider,
  Paper,
  IconButton,
  Autocomplete,
} from "@mui/material";
import { Sword, Shield, Zap, Link as LinkIcon, Plus, Trash2, Coins, Users } from "lucide-react";
import { formatTroops, roundTroops } from "@/utils/formatUtils";

export default function GodModePanel() {
  const {
    step,
    ledger,
    gold_ledger,
    pop_ledger,
    alliances,
    chain_length,
    triggerGodIntervention,
    removeCountry,
    pendingInterventions,
    removePendingIntervention,
    commitInterventions,
  } = useSimulationStore();
  const [selectedCountry, setSelectedCountry] = useState("");
  const [troopAmount, setTroopAmount] = useState(0);

  const [goldAmount, setGoldAmount] = useState(0);
  const [popAmount, setPopAmount] = useState(0);

  const handleIntervention = () => {
    if (!selectedCountry) return;
    const finalTroops = roundTroops(troopAmount);
    const finalGold = goldAmount;
    const finalPop = popAmount;

    triggerGodIntervention(selectedCountry, {
      troopChange: finalTroops,
      goldChange: finalGold,
      popChange: finalPop,
    });

    // Reset inputs
    setTroopAmount(0);
    setGoldAmount(0);
    setPopAmount(0);
  };

  return (
    <Card elevation={6} className="w-full flex flex-col grow" sx={{ bgcolor: "background.paper", overflowY: "auto" }}>
      <CardContent className="flex flex-col gap-6 shrink-0">
        {/* Header */}
        <Box>
          <Typography variant="h5" className="flex items-center gap-2 mb-1" sx={{ fontWeight: "bold" }}>
            <Zap color="#facc15" size={24} />
            God-Mode Panel
          </Typography>
          <Typography variant="caption" className="text-text-secondary">
            Current Phase Execution: Step {step}
          </Typography>
        </Box>

        {/* Intervention Form */}
        <Paper
          variant="outlined"
          sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2, bgcolor: "background.default" }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "text.primary" }}>
              Exogenous Shock
            </Typography>
          </Box>

          <Autocomplete
            size="small"
            options={Object.keys(ledger)}
            value={selectedCountry && Object.keys(ledger).includes(selectedCountry) ? selectedCountry : null}
            onChange={(_, newValue) => setSelectedCountry(newValue || "")}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={
                  Object.keys(ledger).length > 0 ? "Search country in ledger..." : "Waiting for simulation..."
                }
              />
            )}
            disabled={Object.keys(ledger).length === 0}
          />

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
            <Box>
              <Typography variant="caption" sx={{ ml: 1, color: "text.secondary", fontWeight: "bold" }}>
                Troops
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={troopAmount}
                onChange={(e) => setTroopAmount(Number(e.target.value))}
              />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ ml: 1, color: "text.secondary", fontWeight: "bold" }}>
                Gold
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={goldAmount}
                onChange={(e) => setGoldAmount(Number(e.target.value))}
              />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ ml: 1, color: "text.secondary", fontWeight: "bold" }}>
                Pop (M)
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={popAmount}
                onChange={(e) => setPopAmount(Number(e.target.value))}
              />
            </Box>
          </Box>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleIntervention}
            disabled={step !== 0 || !selectedCountry}
            startIcon={<Zap size={16} />}
            sx={{ fontWeight: "bold" }}
          >
            Queue Intervention
          </Button>
        </Paper>

        {/* Pending Queue Section */}
        {pendingInterventions.length > 0 && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              bgcolor: "action.hover",
              borderColor: "warning.main",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}
              >
                <Zap size={16} color="#facc15" /> Pending Queue ({pendingInterventions.length})
              </Typography>
              <Button
                variant="contained"
                size="small"
                color="warning"
                onClick={commitInterventions}
                disabled={step !== 0}
                sx={{ fontWeight: "bold" }}
              >
                PROCEED (COMMIT)
              </Button>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, maxHeight: 150, overflowY: "auto" }}>
              {pendingInterventions.map((item: unknown, idx: number) => (
                <Box
                  key={idx}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 1,
                    bgcolor: "background.paper",
                    borderRadius: 1,
                    borderLeft: "4px solid",
                    borderColor:
                      item.type === "COUNTRY_ADD"
                        ? "success.main"
                        : item.type === "COUNTRY_REMOVE"
                          ? "error.main"
                          : "warning.main",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        color:
                          item.type === "COUNTRY_ADD"
                            ? "success.main"
                            : item.type === "COUNTRY_REMOVE"
                              ? "error.main"
                              : "warning.main",
                      }}
                    >
                      {item.type === "COUNTRY_ADD" && <Plus size={16} />}
                      {item.type === "COUNTRY_REMOVE" && <Sword size={16} />}
                      {item.type === "GOD_INTERVENTION" && <Zap size={16} />}
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: "bold",
                          color: "text.secondary",
                          textTransform: "uppercase",
                          fontSize: "0.65rem",
                        }}
                      >
                        {item.type.replace("_", " ")}
                      </Typography>
                      <Typography variant="body2" component="div" sx={{ fontWeight: "bold" }}>
                        {item.target}
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 0.5 }}>
                          {item.change !== 0 && item.change !== undefined && (
                            <Box
                              component="span"
                              sx={{ color: item.change > 0 ? "success.light" : "error.light", fontSize: "0.75rem" }}
                            >
                              ⚔️ {item.change > 0 ? "+" : ""}
                              {formatTroops(item.change)}
                            </Box>
                          )}
                          {item.gold_change !== 0 && item.gold_change !== undefined && (
                            <Box
                              component="span"
                              sx={{ color: item.gold_change > 0 ? "warning.main" : "error.light", fontSize: "0.75rem" }}
                            >
                              💰 {item.gold_change > 0 ? "+" : ""}
                              {formatTroops(item.gold_change)}
                            </Box>
                          )}
                          {item.pop_change !== 0 && item.pop_change !== undefined && (
                            <Box
                              component="span"
                              sx={{ color: item.pop_change > 0 ? "info.main" : "error.light", fontSize: "0.75rem" }}
                            >
                              👥 {item.pop_change > 0 ? "+" : ""}
                              {item.pop_change}M
                            </Box>
                          )}
                          {item.starting_troops !== undefined && (
                            <Box component="span" sx={{ color: "success.light", fontSize: "0.75rem" }}>
                              ⚔️ {formatTroops(item.starting_troops)}
                            </Box>
                          )}
                          {item.starting_gold !== undefined && (
                            <Box component="span" sx={{ color: "warning.main", fontSize: "0.75rem" }}>
                              💰 {formatTroops(item.starting_gold)}
                            </Box>
                          )}
                          {item.population !== undefined && (
                            <Box component="span" sx={{ color: "info.main", fontSize: "0.75rem" }}>
                              👥 {item.population}M
                            </Box>
                          )}
                        </Box>
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => removePendingIntervention(idx)}
                    sx={{ opacity: 0.7, "&:hover": { opacity: 1 } }}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </Box>
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
              Blocks will be mined containing all these interventions.
            </Typography>
          </Paper>
        )}

        {/* Ledger & Info */}
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
          <Box>
            <Paper
              variant="outlined"
              sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column", bgcolor: "background.default" }}
            >
              <Typography
                variant="overline"
                sx={{
                  color: "text.secondary",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1,
                }}
              >
                <Shield size={14} /> National Statistics
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {Object.entries(ledger).map(([c, val]) => (
                  <Box
                    key={c}
                    sx={{ p: 1, borderRadius: 1, bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <IconButton size="small" color="error" onClick={() => removeCountry(c)} sx={{ p: 0.2 }}>
                          <Trash2 size={12} />
                        </IconButton>
                        <Typography variant="body2" color="primary.light" sx={{ fontWeight: "bold" }}>
                          {c}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: "bold" }}>
                        {formatTroops(val)} ⚔️
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "warning.main" }}>
                        <Coins size={12} />
                        <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                          {formatTroops(gold_ledger[c] || 0)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "info.main" }}>
                        <Users size={12} />
                        <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                          {pop_ledger[c] || 0}M
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>

          <Box>
            <Paper
              variant="outlined"
              sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column", bgcolor: "background.default" }}
            >
              <Typography
                variant="overline"
                sx={{
                  color: "text.secondary",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1,
                }}
              >
                <LinkIcon size={14} /> Alliances
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, color: "success.light" }}>
                {alliances.length > 0 ? (
                  alliances.map((a) => (
                    <Typography key={a} variant="body2">
                      {a}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    None
                  </Typography>
                )}
              </Box>

              <Box sx={{ mt: "auto", pt: 2 }}>
                <Divider sx={{ mb: 1 }} />
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                  Chain Length
                </Typography>
                <Typography variant="h6" sx={{ fontFamily: "monospace" }}>
                  {chain_length}
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
