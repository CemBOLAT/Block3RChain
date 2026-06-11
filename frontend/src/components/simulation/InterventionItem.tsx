import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { Plus, Sword, Zap, Trash2, Swords, Receipt, Castle } from "lucide-react";
import { formatTroops, formatGold } from "@/utils/formatUtils";
import { Mempool } from "@/types/simulation";

function rateToDisplayPct(rate: number): number {
  return Math.round(rate * 50);
}

interface InterventionItemProps {
  intervention: Mempool;
  onRemove: () => void;
}

/** Color palette matching FortificationsSection tier colors. */
const CASTLE_TIER_COLOR: Record<number, string> = {
  1: "#38bdf8", // sky-400  (Tier 1 Outpost)
  2: "#fbbf24", // amber-400 (Tier 2 Keep)
  3: "#f87171", // red-400  (Tier 3 Fortress)
};
const CASTLE_TIER_LABEL: Record<number, string> = {
  1: "Tier 1 Outpost",
  2: "Tier 2 Keep",
  3: "Tier 3 Fortress",
};

const typeColor = (type: string) =>
  type === "COUNTRY_ADD" || type === "ADD_RIVAL"
    ? "success.main"
    : type === "COUNTRY_REMOVE" || type === "REMOVE_RIVAL"
      ? "error.main"
      : "warning.main";

const InterventionItem: React.FC<InterventionItemProps> = ({ intervention, onRemove }) => {
  const isCastle =
    intervention.type === "BUILD_CASTLE" || intervention.type === "DEMOLISH_CASTLE";
  const castleLevel = isCastle ? (intervention.level as number | undefined) : undefined;
  const castleTierColor = castleLevel ? CASTLE_TIER_COLOR[castleLevel] : undefined;
  const borderColor = castleTierColor ?? typeColor(intervention.type);

  return (
    <Box
      className="flex items-center justify-between p-2 !rounded-lg !border-l-[4px]"
      sx={{
        bgcolor: "background.paper",
        borderColor,
      }}
    >
      <Box className="flex items-center gap-3">
        <Box sx={{ color: borderColor }}>
          {intervention.type === "COUNTRY_ADD" && <Plus size={16} />}
          {intervention.type === "COUNTRY_REMOVE" && <Sword size={16} />}
          {intervention.type === "GOD_INTERVENTION" && <Zap size={16} />}
          {intervention.type === "ADD_RIVAL" && <Swords size={16} />}
          {intervention.type === "REMOVE_RIVAL" && <Swords size={16} />}
          {intervention.type === "SET_TAX_RATE" && <Receipt size={16} />}
          {isCastle && <Castle size={16} />}
        </Box>
        <Box className="flex flex-col">
          <Typography
            variant="caption"
            sx={{
              fontWeight: "bold",
              color: "text.secondary",
              textTransform: "uppercase",
              fontSize: "0.65rem",
            }}
          >
            {intervention.type.replace(/_/g, " ")}
          </Typography>
          <Typography variant="body2" component="div" className="!font-bold">
            {intervention.target}
            {intervention.rival_id && (
              <Typography
                component="span"
                variant="caption"
                sx={{ display: "block", color: "text.secondary", fontWeight: 600, mt: 0.25 }}
              >
                {intervention.type === "ADD_RIVAL" ? "→" : "✕"} {intervention.rival_id}
              </Typography>
            )}
            <Box className="flex flex-wrap gap-2 mt-1">
              {intervention.troop_change !== 0 && intervention.troop_change !== undefined && (
                <Box
                  component="span"
                  className="text-xs"
                  sx={{ color: intervention.troop_change > 0 ? "success.light" : "error.light" }}
                >
                  ⚔️ {intervention.troop_change > 0 ? "+" : ""}
                  {formatTroops(intervention.troop_change)}
                </Box>
              )}
              {intervention.gold_change !== 0 && intervention.gold_change !== undefined && (
                <Box
                  component="span"
                  className="text-xs"
                  sx={{ color: intervention.gold_change > 0 ? "warning.main" : "error.light" }}
                >
                  💰 {intervention.gold_change > 0 ? "+" : ""}
                  {formatGold(intervention.gold_change)}
                </Box>
              )}
              {intervention.pop_change !== 0 && intervention.pop_change !== undefined && (
                <Box
                  component="span"
                  className="text-xs"
                  sx={{ color: intervention.pop_change > 0 ? "info.main" : "error.light" }}
                >
                  👥 {intervention.pop_change > 0 ? "+" : ""}
                  {intervention.pop_change}M
                </Box>
              )}
              {intervention.starting_troops !== undefined && (
                <Box component="span" className="text-xs" sx={{ color: "success.light" }}>
                  ⚔️ {formatTroops(intervention.starting_troops)}
                </Box>
              )}
              {intervention.starting_gold !== undefined && (
                <Box component="span" className="text-xs" sx={{ color: "warning.main" }}>
                  💰 {formatGold(intervention.starting_gold)}
                </Box>
              )}
              {intervention.starting_population !== undefined && (
                <Box component="span" className="text-xs" sx={{ color: "info.main" }}>
                  👥 {intervention.starting_population}M
                </Box>
              )}
              {intervention.starting_happiness !== undefined && (
                <Box component="span" className="text-xs" sx={{ color: "#34d399" }}>
                  😊 {intervention.starting_happiness}
                </Box>
              )}
              {isCastle && castleLevel != null && (
                <Box
                  component="span"
                  className="text-xs"
                  sx={{ color: castleTierColor, fontWeight: 700 }}
                >
                  <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.4 }}>
                    <Castle size={11} />
                    {" "}{CASTLE_TIER_LABEL[castleLevel] ?? `Tier ${castleLevel}`}
                    {intervention.type === "DEMOLISH_CASTLE" && " (demolish)"}
                  </Box>
                </Box>
              )}
              {intervention.type === "SET_TAX_RATE" &&
                intervention.tax_rate != null &&
                (() => {
                  const newRate = intervention.tax_rate as number;
                  const oldRate = intervention.old_tax_rate != null ? (intervention.old_tax_rate as number) : 1.0;
                  const oldPct = rateToDisplayPct(oldRate);
                  const newPct = rateToDisplayPct(newRate);
                  const increased = newRate > oldRate;
                  const unchanged = newRate === oldRate;
                  const color = unchanged ? "text.secondary" : increased ? "success.light" : "error.light";
                  return (
                    <Box component="span" className="text-xs" sx={{ color, fontWeight: 600 }}>
                      📊 {oldPct}% → {newPct}%
                    </Box>
                  );
                })()}
            </Box>
          </Typography>
        </Box>
      </Box>
      <IconButton size="small" color="error" onClick={onRemove} sx={{ opacity: 0.7, "&:hover": { opacity: 1 } }}>
        <Trash2 size={14} />
      </IconButton>
    </Box>
  );
};

export default InterventionItem;
