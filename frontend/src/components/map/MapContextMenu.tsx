import React, { useState, useEffect } from "react";
import { Menu, MenuItem, ListItemIcon, ListItemText, Divider, Box, Typography, Chip, Tooltip, Slider } from "@mui/material";
import { Trash2, Castle, Shield, Hammer, Coins } from "lucide-react";
import { MapContextMenuState, GodInterventionType } from "@/types/map";
import { ACTION_GROUPS } from "@/data/interventionActions";
import { useSimulationStore } from "@/store/useSimulationStore";
import { CastleLevel } from "@/types/gameParameters";

interface MapContextMenuProps {
  contextMenu: MapContextMenuState | null;
  onClose: () => void;
  onAction: (type: GodInterventionType) => void;
}

export default function MapContextMenu({ contextMenu, onClose, onAction }: MapContextMenuProps) {
  const { castle_ledger, gold_ledger, pop_ledger, tax_ledger, game_parameters,
    buildCastle, demolishCastle, setTaxRate, step, pendingInterventions } = useSimulationStore();

  const countryName = contextMenu?.targetName || "";

  // Effective rate: pending intervention takes precedence over tax_ledger
  // (pending SET_TAX_RATE is queued but not yet mined, so tax_ledger still has old value)
  const effectiveRate = (() => {
    const pending = pendingInterventions.find(
      (i) => i.type === "SET_TAX_RATE" && i.target === countryName
    );
    if (pending && pending.tax_rate != null) return pending.tax_rate as number;
    return tax_ledger[countryName] ?? 1.0;
  })();

  // Progressive formula: slider 0-100 → tax_rate 0.0-2.0
  // 50% slider = tax_rate 1.0 = full base income
  // 100% slider = tax_rate 2.0 = double income
  const rateToSlider = (r: number) => Math.round(r * 50);
  const sliderToRate = (s: number) => s / 50.0;

  // Local draft so slider moves smoothly; commits to API on mouse-up only
  const [draftTaxPct, setDraftTaxPct] = useState<number>(() => rateToSlider(effectiveRate));
  useEffect(() => {
    setDraftTaxPct(rateToSlider(effectiveRate));
  }, [countryName, effectiveRate]);

  const handleAction = (type: GodInterventionType) => {
    onAction(type);
    onClose();
  };



  // Merge confirmed castles with pending BUILD_CASTLE interventions for display
  const confirmedCastles = castle_ledger[countryName] || [];
  const pendingBuilds: number[] = pendingInterventions
    .filter((i) => i.type === "BUILD_CASTLE" && i.target === countryName && i.level != null)
    .map((i) => i.level as number);
  const pendingDemolishes: number[] = pendingInterventions
    .filter((i) => i.type === "DEMOLISH_CASTLE" && i.target === countryName && i.level != null)
    .map((i) => i.level as number);

  // Effective castle list = confirmed + pending builds - pending demolishes
  const effectiveCastles = [...confirmedCastles, ...pendingBuilds];
  for (const lvl of pendingDemolishes) {
    const idx = effectiveCastles.indexOf(lvl);
    if (idx !== -1) effectiveCastles.splice(idx, 1);
  }
  const countryCastles = effectiveCastles;

  // Effective gold = current minus pending build costs
  const pendingBuildCost = pendingBuilds.reduce(
    (acc, lvl) => acc + game_parameters.castles[lvl as CastleLevel].build_cost,
    0,
  );
  const effectiveGold = (gold_ledger[countryName] || 0) - pendingBuildCost;

  const castleL1 = game_parameters.castles[1];
  const castleL2 = game_parameters.castles[2];
  const castleL3 = game_parameters.castles[3];

  const canAffordL1 = effectiveGold >= castleL1.build_cost;
  const canAffordL2 = effectiveGold >= castleL2.build_cost;
  const canAffordL3 = effectiveGold >= castleL3.build_cost;

  return (
    <Menu
      open={contextMenu !== null}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
      slotProps={{
        paper: {
          elevation: 8,
          sx: {
            width: 280,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          },
        },
      }}
    >
      {/* Title */}
      <Box className="px-4 py-3">
        <Typography
          variant="caption"
          className="block !font-extrabold"
          sx={{
            color: "primary.main",
            textTransform: "uppercase",
            letterSpacing: 1.2,
          }}
        >
          {countryName}
        </Typography>
        <Typography variant="overline" className="!leading-none text-[10px]" sx={{ color: "text.secondary", fontWeight: 700 }}>
          Gold Treasury: {((gold_ledger[countryName] || 0) / 1000).toFixed(1)}K 💰{pendingBuildCost > 0 ? ` (−${(pendingBuildCost/1000).toFixed(1)}K pending)` : ""}

        </Typography>
      </Box>

      <Divider />

      {/* God Interventions Section */}
      {contextMenu?.isSimulationMember && (
        <Box className="py-0.5">
          <Box className="px-4 py-1">
            <Typography variant="overline" className="!leading-none text-[10px]" sx={{ color: "text.secondary", fontWeight: 700 }}>
              God Interventions
            </Typography>
          </Box>
          {ACTION_GROUPS.map((group, groupIndex) => (
            <React.Fragment key={group.id}>
              {groupIndex > 0 && <Divider className="!my-1" />}
              {group.actions.map((action) => {
                const Icon = action.icon;

                return (
                  <MenuItem key={action.type} onClick={() => handleAction(action.type)}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Icon size={16} color={action.iconColor} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" className="!font-bold">
                          {action.label}
                        </Typography>
                      }
                      {...(action.secondary && {
                        secondary: (
                          <Typography variant="caption" sx={{ color: action.secondaryColor }}>
                            {action.secondary}
                          </Typography>
                        ),
                      })}
                    />
                  </MenuItem>
                );
              })}
            </React.Fragment>
          ))}
        </Box>
      )}

      <Divider />

      {/* Castle Fortifications Section */}
      {contextMenu?.isSimulationMember && (
        <Box className="py-0.5">
          <Box className="px-4 py-1.5 flex items-center justify-between">
            <Typography variant="overline" className="!leading-none text-[10px] flex items-center gap-1" sx={{ color: "text.secondary", fontWeight: 700 }}>
              <Castle size={12} className="text-indigo-400" /> Fortifications
            </Typography>
            <Chip
              size="small"
              label={`${countryCastles.length} Built`}
              color="primary"
              variant="outlined"
              sx={{ height: 16, fontSize: "0.6rem", fontWeight: 700 }}
            />
          </Box>

          {/* Active Castles list with Demolish option */}
          <Box className="px-4 pb-2 pt-0.5">
            {countryCastles.length > 0 ? (
              <Box className="flex flex-wrap gap-1">
                {countryCastles.map((lvl, index) => (
                  <Tooltip
                    key={`${lvl}-${index}`}
                    title={`Defending with +${game_parameters.castles[lvl as CastleLevel].defense / 1000}K troops. Click X to demolish (no refund).`}
                    arrow
                    placement="top"
                  >
                    <Chip
                      size="small"
                      icon={<Shield size={10} />}
                      label={`Tier ${lvl}`}
                      color={lvl === 1 ? "info" : lvl === 2 ? "warning" : "error"}
                      onDelete={step === 0 ? () => {
                        demolishCastle(countryName, lvl);
                        onClose();
                      } : undefined}
                      sx={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        height: 20,
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>
            ) : (
              <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>
                No fortifications.
              </Typography>
            )}
          </Box>

          {/* Construction options */}
          {step === 0 && (
            <Box className="py-0.5">
              <MenuItem 
                disabled={!canAffordL1} 
                onClick={() => {
                  buildCastle(countryName, 1);
                  onClose();
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Hammer size={16} className="text-sky-400" />
                </ListItemIcon>
                <ListItemText
                  primary={<Typography variant="body2" sx={{ fontWeight: 700 }}>Build Tier 1 Outpost</Typography>}
                  secondary={<Typography variant="caption" color="text.secondary">Cost: {castleL1.build_cost/1000}K 💰 | +{castleL1.defense/1000}K 🛡️</Typography>}
                />
              </MenuItem>

              <MenuItem 
                disabled={!canAffordL2} 
                onClick={() => {
                  buildCastle(countryName, 2);
                  onClose();
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Hammer size={16} className="text-amber-400" />
                </ListItemIcon>
                <ListItemText
                  primary={<Typography variant="body2" sx={{ fontWeight: 700 }}>Build Tier 2 Keep</Typography>}
                  secondary={<Typography variant="caption" color="text.secondary">Cost: {castleL2.build_cost/1000}K 💰 | +{castleL2.defense/1000}K 🛡️</Typography>}
                />
              </MenuItem>

              <MenuItem 
                disabled={!canAffordL3} 
                onClick={() => {
                  buildCastle(countryName, 3);
                  onClose();
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Hammer size={16} className="text-red-400" />
                </ListItemIcon>
                <ListItemText
                  primary={<Typography variant="body2" sx={{ fontWeight: 700 }}>Build Tier 3 Fortress</Typography>}
                  secondary={<Typography variant="caption" color="text.secondary">Cost: {castleL3.build_cost/1000}K 💰 | +{castleL3.defense/1000}K 🛡️</Typography>}
                />
              </MenuItem>
            </Box>
          )}
        </Box>
      )}

      {/* Tax Rate Section */}
      {contextMenu?.isSimulationMember && step === 0 && (
        <Box className="py-0.5">
          <Divider className="!my-1" />
          <Box className="px-4 py-1.5 flex items-center justify-between">
            <Typography variant="overline" className="!leading-none text-[10px] flex items-center gap-1" sx={{ color: "text.secondary", fontWeight: 700 }}>
              <Coins size={12} color="#f59e0b" /> Tax Rate
            </Typography>
            {(() => {
              const col = draftTaxPct >= 50 ? "#4ade80" : draftTaxPct >= 25 ? "#fbbf24" : "#f87171";
              const pop = pop_ledger[countryName] || 0;
              const income = Math.round(pop * 1000 * sliderToRate(draftTaxPct));
              const incomeStr = income >= 1000 ? `${(income/1000).toFixed(1)}K` : `${income}`;
              return (
                <Tooltip
                  title={`${draftTaxPct}% slider · ${pop}M pop → ${incomeStr} gold/tick | 50%=base income, 100%=2× income`}
                  placement="top" arrow
                >
                  <Typography variant="caption" sx={{ fontWeight: 900, fontFamily: "monospace", color: col, cursor: "help" }}>
                    {draftTaxPct}%
                  </Typography>
                </Tooltip>
              );
            })()}
          </Box>
          <Box className="px-4 pb-2">
            <Slider
              size="small"
              min={0}
              max={100}
              step={5}
              value={draftTaxPct}
              onChange={(_e, val) => {
                setDraftTaxPct(val as number);
              }}
              onChangeCommitted={(_e, val) => setTaxRate(countryName, sliderToRate(val as number))}
              sx={{
                py: 0.5,
                color: draftTaxPct >= 50 ? "#4ade80" : draftTaxPct >= 25 ? "#fbbf24" : "#f87171",
                "& .MuiSlider-thumb": { width: 14, height: 14 },
                "& .MuiSlider-rail": { opacity: 0.25 },
              }}
            />
            <Box className="flex justify-between">
              <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.6rem" }}>0% — no income</Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.6rem", fontWeight: 700 }}>50% = base</Typography>
              <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.6rem" }}>100% = 2×</Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* Delete Country Action */}
      {contextMenu?.isSimulationMember && (
        <Box className="py-0.5">
          <Divider className="!my-1" />
          <MenuItem
            onClick={() => handleAction("delete")}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Trash2 size={16} color="#ef4444" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  Remove Nation
                </Typography>
              }
            />
          </MenuItem>
        </Box>
      )}
    </Menu>
  );
}
