import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { Plus, Sword, Zap, Trash2 } from "lucide-react";
import { formatTroops, formatGold } from "@/utils/formatUtils";
import { Mempool } from "@/types/simulation";

interface InterventionItemProps {
  item: Mempool;
  onRemove: () => void;
}

const InterventionItem: React.FC<InterventionItemProps> = ({ item, onRemove }) => {
  const typeColor =
    item.type === "COUNTRY_ADD"
      ? "success.main"
      : item.type === "COUNTRY_REMOVE"
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
          {item.type === "COUNTRY_ADD" && <Plus size={16} />}
          {item.type === "COUNTRY_REMOVE" && <Sword size={16} />}
          {item.type === "GOD_INTERVENTION" && <Zap size={16} />}
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
            {item.type.replace("_", " ")}
          </Typography>
          <Typography variant="body2" component="div" className="!font-bold">
            {item.target}
            <Box className="flex flex-wrap gap-2 mt-1">
              {item.change !== 0 && item.change !== undefined && (
                <Box
                  component="span"
                  className="text-xs"
                  sx={{ color: item.change > 0 ? "success.light" : "error.light" }}
                >
                  ⚔️ {item.change > 0 ? "+" : ""}
                  {formatTroops(item.change)}
                </Box>
              )}
              {item.gold_change !== 0 && item.gold_change !== undefined && (
                <Box
                  component="span"
                  className="text-xs"
                  sx={{ color: item.gold_change > 0 ? "warning.main" : "error.light" }}
                >
                  💰 {item.gold_change > 0 ? "+" : ""}
                  {formatGold(item.gold_change)}
                </Box>
              )}
              {item.pop_change !== 0 && item.pop_change !== undefined && (
                <Box
                  component="span"
                  className="text-xs"
                  sx={{ color: item.pop_change > 0 ? "info.main" : "error.light" }}
                >
                  👥 {item.pop_change > 0 ? "+" : ""}
                  {item.pop_change}M
                </Box>
              )}
              {item.starting_troops !== undefined && (
                <Box component="span" className="text-xs" sx={{ color: "success.light" }}>
                  ⚔️ {formatTroops(item.starting_troops)}
                </Box>
              )}
              {item.starting_gold !== undefined && (
                <Box component="span" className="text-xs" sx={{ color: "warning.main" }}>
                  💰 {formatGold(item.starting_gold)}
                </Box>
              )}
              {item.population !== undefined && (
                <Box component="span" className="text-xs" sx={{ color: "info.main" }}>
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
        onClick={onRemove}
        sx={{ opacity: 0.7, "&:hover": { opacity: 1 } }}
      >
        <Trash2 size={14} />
      </IconButton>
    </Box>
  );
};

export default InterventionItem;
