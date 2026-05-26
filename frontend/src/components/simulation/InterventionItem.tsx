import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { Plus, Sword, Zap, Trash2 } from "lucide-react";
import { formatTroops, formatGold } from "@/utils/formatUtils";
import { Mempool } from "@/types/simulation";

interface InterventionItemProps {
  intervention: Mempool;
  onRemove: () => void;
}

const InterventionItem: React.FC<InterventionItemProps> = ({ intervention, onRemove }) => {
  const typeColor =
    intervention.type === "COUNTRY_ADD"
      ? "success.main"
      : intervention.type === "COUNTRY_REMOVE"
        ? "error.main"
        : "warning.main";

  return (
    <Box
      className="flex items-center justify-between p-2 !rounded-lg !border-l-[4px]"
      sx={{
        bgcolor: "background.paper",
        borderColor: typeColor,
      }}
    >
      <Box className="flex items-center gap-3">
        <Box sx={{ color: typeColor }}>
          {intervention.type === "COUNTRY_ADD" && <Plus size={16} />}
          {intervention.type === "COUNTRY_REMOVE" && <Sword size={16} />}
          {intervention.type === "GOD_INTERVENTION" && <Zap size={16} />}
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
            {intervention.type.replace("_", " ")}
          </Typography>
          <Typography variant="body2" component="div" className="!font-bold">
            {intervention.target}
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
            </Box>
          </Typography>
        </Box>
      </Box>
      <IconButton
        size="small"
        color="error"
        onClick={onRemove}
        sx={{ opacity: 0.7, "&:hover": { opacity: 1 } }}
      >
        <Trash2 size={14} />
      </IconButton>
    </Box>
  );
};

export default InterventionItem;
