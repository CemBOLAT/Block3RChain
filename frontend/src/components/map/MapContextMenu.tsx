import React, { useState, useEffect } from "react";
import { Menu, MenuItem, ListItemIcon, ListItemText, Divider, Box, Typography } from "@mui/material";
import { Trash2 } from "lucide-react";
import { MapContextMenuState, GodInterventionType } from "@/types/map";
import { useSimulationStore } from "@/store/useSimulationStore";
import { CastleLevel } from "@/types/gameParameters";
import GodInterventionsSection from "@/components/map/GodInterventionsSection";
import FortificationsSection from "@/components/map/FortificationsSection";
import TaxRateSection from "@/components/map/TaxRateSection";
import RivalrySection from "@/components/map/RivalrySection";

interface MapContextMenuProps {
  contextMenu: MapContextMenuState | null;
  onClose: () => void;
  onAction: (type: GodInterventionType) => void;
}

export default function MapContextMenu({ contextMenu, onClose, onAction }: MapContextMenuProps) {
  const { castle_ledger, gold_ledger, pop_ledger, tax_ledger, rival_ledger, ledger, game_parameters,
    buildCastle, demolishCastle, setTaxRate, addRival, removeRival, step, pendingInterventions } = useSimulationStore();

  const countryName = contextMenu?.targetName || "";

  const effectiveRate = (() => {
    const pending = pendingInterventions.find(
      (i) => i.type === "SET_TAX_RATE" && i.target === countryName
    );
    if (pending && pending.tax_rate != null) return pending.tax_rate as number;
    return tax_ledger[countryName] ?? 1.0;
  })();

  const rateToSlider = (r: number) => Math.round(r * 50);
  const sliderToRate = (s: number) => s / 50.0;

  const [draftTaxPct, setDraftTaxPct] = useState<number>(() => rateToSlider(effectiveRate));
  useEffect(() => {
    setDraftTaxPct(rateToSlider(effectiveRate));
  }, [countryName, effectiveRate]);

  const handleAction = (type: GodInterventionType) => {
    onAction(type);
    onClose();
  };

  const confirmedCastles = castle_ledger[countryName] || [];
  const pendingBuilds: number[] = pendingInterventions
    .filter((i) => i.type === "BUILD_CASTLE" && i.target === countryName && i.level != null)
    .map((i) => i.level as number);
  const pendingDemolishes: number[] = pendingInterventions
    .filter((i) => i.type === "DEMOLISH_CASTLE" && i.target === countryName && i.level != null)
    .map((i) => i.level as number);

  const effectiveCastles = [...confirmedCastles, ...pendingBuilds];
  for (const lvl of pendingDemolishes) {
    const idx = effectiveCastles.indexOf(lvl);
    if (idx !== -1) effectiveCastles.splice(idx, 1);
  }
  const countryCastles = effectiveCastles;

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

  const confirmedRivals = rival_ledger[countryName] ?? [];
  const pendingRivalAdds = pendingInterventions
    .filter((i) => i.type === "ADD_RIVAL" && i.target === countryName && i.rival_id)
    .map((i) => i.rival_id as string);
  const pendingRivalRemoves = pendingInterventions
    .filter((i) => i.type === "REMOVE_RIVAL" && i.target === countryName && i.rival_id)
    .map((i) => i.rival_id as string);

  const effectiveRivals = [...confirmedRivals, ...pendingRivalAdds];
  for (const rival of pendingRivalRemoves) {
    const idx = effectiveRivals.indexOf(rival);
    if (idx !== -1) effectiveRivals.splice(idx, 1);
  }

  const nonRivals = Object.keys(ledger).filter(
    (n) => n !== countryName && !effectiveRivals.includes(n),
  );

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
            width: 350,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          },
        },
      }}
    >
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
      </Box>

      <Divider />

      <GodInterventionsSection
        isSimulationMember={!!contextMenu?.isSimulationMember}
        onSelect={handleAction}
      />

      <Divider />

      <FortificationsSection
        isSimulationMember={!!contextMenu?.isSimulationMember}
        countryName={countryName}
        countryCastles={countryCastles}
        game_parameters={game_parameters}
        step={step}
        canAffordL1={canAffordL1}
        canAffordL2={canAffordL2}
        canAffordL3={canAffordL3}
        onBuild={buildCastle}
        onDemolish={demolishCastle}
        onClose={onClose}
      />

      <TaxRateSection
        isSimulationMember={!!contextMenu?.isSimulationMember}
        step={step}
        countryName={countryName}
        pop={pop_ledger[countryName] || 0}
        draftTaxPct={draftTaxPct}
        setDraftTaxPct={setDraftTaxPct}
        sliderToRate={sliderToRate}
        onCommitRate={setTaxRate}
      />

      <RivalrySection
        isSimulationMember={!!contextMenu?.isSimulationMember}
        step={step}
        countryName={countryName}
        rivals={effectiveRivals}
        nonRivals={nonRivals}
        onAddRival={(rivalId) => addRival(countryName, rivalId)}
        onRemoveRival={(rivalId) => removeRival(countryName, rivalId)}
      />

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
