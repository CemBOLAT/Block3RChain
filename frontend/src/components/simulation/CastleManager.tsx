import React, { useState } from "react";
import { Box, Typography, Button, Tooltip, Card, CardContent, Divider, Chip } from "@mui/material";
import { Castle, Coins, Shield, Hammer } from "lucide-react";
import { useSimulationStore } from "@/store/useSimulationStore";
import { formatGold } from "@/utils/formatUtils";
import { CastleLevel } from "@/types/gameParameters";

export const CastleManager: React.FC = () => {
  const { castle_ledger, gold_ledger, game_parameters, buildCastle, demolishCastle, step, ledger } = useSimulationStore();
  const [selectedLevel, setSelectedLevel] = useState<CastleLevel>(1);
  const [selectedCountry, setSelectedCountry] = useState<string>("");

  const activeCountries = Object.keys(ledger);
  const currentCountry = selectedCountry || activeCountries[0] || "";
  const countryCastles = castle_ledger[currentCountry] || [];
  const currentGold = gold_ledger[currentCountry] || 0;

  const levelParams = game_parameters.castles[selectedLevel];
  const buildCost = levelParams.build_cost;
  const maintenanceCost = levelParams.maintenance;
  const defenseBonus = levelParams.defense;

  const canAfford = currentGold >= buildCost;

  const handleBuild = () => {
    if (!currentCountry || !canAfford) return;
    buildCastle(currentCountry, selectedLevel);
  };

  const getLevelLabel = (lvl: number) => {
    if (lvl === 1) return "L1 Outpost";
    if (lvl === 2) return "L2 Keep";
    return "L3 Fortress";
  };

  const getLevelColor = (lvl: number) => {
    if (lvl === 1) return "info";
    if (lvl === 2) return "warning";
    return "error";
  };

  return (
    <Card
      sx={{
        bgcolor: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        borderRadius: "12px",
        overflow: "visible",
      }}
    >
      <CardContent className="flex flex-col gap-4">
        {/* Header */}
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <Castle className="text-primary-light" size={20} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary" }}>
              Castle Fortifications
            </Typography>
          </Box>
          <Chip
            size="small"
            label={`${countryCastles.length} Active`}
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 600, borderColor: "rgba(99, 102, 241, 0.3)" }}
          />
        </Box>

        {/* Country Selector Dropdown */}
        <Box className="flex flex-col gap-1.5">
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Select Nation to Fortify:
          </Typography>
          <select
            value={currentCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            disabled={activeCountries.length === 0}
            className="w-full bg-slate-900/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            {activeCountries.map((c) => (
              <option key={c} value={c} className="bg-slate-950 text-white">
                {c} ({formatGold(gold_ledger[c] || 0)} 💰)
              </option>
            ))}
          </select>
        </Box>

        {/* Active Castles Badges */}
        {countryCastles.length > 0 ? (
          <Box className="flex flex-wrap gap-2 py-1">
            {countryCastles.map((lvl, index) => (
              <Tooltip
                key={`${lvl}-${index}`}
                title={`Level ${lvl} Castle - Defending with +${game_parameters.castles[lvl as CastleLevel].defense.toLocaleString()} troops`}
                arrow
                placement="top"
              >
                <Chip
                  icon={<Shield size={12} />}
                  label={getLevelLabel(lvl)}
                  color={getLevelColor(lvl)}
                  size="small"
                  onDelete={step === 0 ? () => demolishCastle(currentCountry, lvl) : undefined}
                  sx={{
                    fontWeight: 600,
                    textTransform: "uppercase",
                    fontSize: "0.65rem",
                    letterSpacing: "0.05em",
                  }}
                />
              </Tooltip>
            ))}
          </Box>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
            No castles constructed yet. Build fortifications to boost dynamic defense power!
          </Typography>
        )}

        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.05)" }} />

        {/* Level Selection Tabs */}
        <Box className="flex flex-col gap-2">
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Select Fortification Tier:
          </Typography>
          <Box className="grid grid-cols-3 gap-2 bg-slate-900/60 p-1 rounded-lg border border-white/5">
            {([1, 2, 3] as const).map((lvl) => (
              <Button
                key={lvl}
                variant={selectedLevel === lvl ? "contained" : "text"}
                size="small"
                onClick={() => setSelectedLevel(lvl)}
                color={getLevelColor(lvl)}
                sx={{
                  py: 0.75,
                  minWidth: 0,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  borderRadius: "6px",
                  boxShadow: selectedLevel === lvl ? 3 : "none",
                }}
              >
                Tier {lvl}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Castle Stats breakdown */}
        <Box className="grid grid-cols-3 gap-3 bg-slate-900/40 p-3 rounded-lg border border-white/5">
          <Box className="flex flex-col gap-0.5">
            <Box className="flex items-center gap-1">
              <Coins size={12} className="text-warning-light" />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", fontWeight: 600 }}>
                Build Cost
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
              {buildCost === 0 ? "0" : `${buildCost / 1000}K`} 💰
            </Typography>
          </Box>

          <Box className="flex flex-col gap-0.5">
            <Box className="flex items-center gap-1">
              <Coins size={12} className="text-error-light" />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", fontWeight: 600 }}>
                Maint. / Mo
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
              {maintenanceCost === 0 ? "0" : `${maintenanceCost / 1000}K`} 💰
            </Typography>
          </Box>

          <Box className="flex flex-col gap-0.5">
            <Box className="flex items-center gap-1">
              <Shield size={12} className="text-success-light" />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", fontWeight: 600 }}>
                Defense
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: "success.light" }}>
              +{defenseBonus === 0 ? "0" : `${defenseBonus / 1000}K`}
            </Typography>
          </Box>
        </Box>

        {/* Action Button */}
        <Button
          variant="contained"
          fullWidth
          disabled={!currentCountry || !canAfford || step !== 0}
          onClick={handleBuild}
          startIcon={<Hammer size={16} />}
          sx={{
            py: 1,
            fontWeight: 700,
            textTransform: "none",
            borderRadius: "8px",
            background: (canAfford && currentCountry)
              ? "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)"
              : "rgba(255,255,255,0.05)",
            boxShadow: (canAfford && currentCountry) ? "0 4px 12px 0 rgba(99, 102, 241, 0.3)" : "none",
            "&:hover": {
              background: "linear-gradient(135deg, #4338ca 0%, #4f46e5 100%)",
            },
          }}
        >
          {step !== 0
            ? "Simulation Active"
            : !currentCountry
            ? "No Nations"
            : !canAfford
            ? `Need ${buildCost === 0 ? "0" : `${buildCost / 1000}K`} Gold`
            : `Build Fortification (-${buildCost === 0 ? "0" : `${buildCost / 1000}K`} 💰)`}
        </Button>
      </CardContent>
    </Card>
  );
};
