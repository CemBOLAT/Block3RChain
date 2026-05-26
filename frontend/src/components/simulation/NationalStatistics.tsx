import React from "react";
import { Box, Paper, Typography, IconButton, Tooltip } from "@mui/material";
import { Shield, Trash2, Coins, Users, Castle, Smile, Swords } from "lucide-react";
import { formatTroops, formatGold } from "@/utils/formatUtils";
import { useSimulationStore } from "@/store/useSimulationStore";
import { CastleLevel } from "@/types/gameParameters";

const NationalStatistics: React.FC = () => {
  const {
    ledger,
    gold_ledger,
    pop_ledger,
    castle_ledger,
    tax_ledger,
    happiness_ledger,
    rival_ledger,
    game_parameters,
    removeCountry,
    pendingInterventions,
  } = useSimulationStore();

  const anyHasCastle = Object.values(castle_ledger).some((lvls) => lvls.length > 0);

  // Progressive formula: tax_rate 0.0-2.0, slider display = rate*50 (50%=base, 100%=2×)
  const effectiveTaxRate = (country: string): number => {
    const pending = pendingInterventions.find(
      (i) => i.type === "SET_TAX_RATE" && i.target === country
    );
    if (pending && pending.tax_rate != null) return pending.tax_rate as number;
    return tax_ledger[country] ?? 1.0;
  };

  return (
    <Box>
      <Paper variant="outlined" className="flex flex-col gap-2 p-4" sx={{ bgcolor: "background.default" }}>
        <Typography
          variant="overline"
          className="!font-bold flex items-center gap-2"
          sx={{ color: "text.secondary" }}
        >
          <Shield size={14} /> National Statistics
        </Typography>

        <Box className="flex flex-col gap-2">
          {Object.entries(ledger).map(([c, troops]) => {
            const levels = castle_ledger[c] || [];
            const bonus = levels.reduce(
              (total, level) => total + (game_parameters.castles[level as CastleLevel]?.defense ?? 0),
              0,
            );
            const soloPower = troops + bonus;
            const hasCastle = bonus > 0;
            const happiness = happiness_ledger[c] ?? 75;
            const belowLimit = happiness < game_parameters.happiness_limit;
            const rivals = rival_ledger[c] ?? [];

            return (
              <Box
                key={c}
                className="flex flex-col gap-1 rounded-sm p-2"
                sx={{
                  bgcolor: "action.hover",
                  border: "1px solid",
                  borderColor: belowLimit ? "error.main" : "divider",
                }}
              >
                {/* Row 1: name + troops + solo power */}
                <Box className="flex items-center gap-1.5">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => removeCountry(c)}
                    sx={{ p: 0.2, flexShrink: 0 }}
                  >
                    <Trash2 size={13} />
                  </IconButton>

                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, color: "primary.light", flexShrink: 0, minWidth: 60, fontSize: "0.78rem" }}
                  >
                    {c}
                  </Typography>

                  <Box className="grow" />

                  {/* Troops (attack) */}
                  <Tooltip title="Asker (Saldırı)" placement="top">
                    <Box className="flex items-center gap-0.5 shrink-0">
                      <span style={{ fontSize: 11 }}>⚔️</span>
                      <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                        {formatTroops(troops)}
                      </Typography>
                    </Box>
                  </Tooltip>

                  {/* Solo defense — only when castle exists anywhere */}
                  {anyHasCastle && (
                    <Tooltip
                      title={
                        hasCastle
                          ? `Solo Savunma = ${formatTroops(troops)} asker + ${formatTroops(bonus)} kale`
                          : "Kale yok — solo savunma = asker gücü"
                      }
                      placement="top"
                      arrow
                    >
                      <Box
                        className="flex items-center gap-0.5 shrink-0"
                        sx={{ minWidth: 56, justifyContent: "flex-end", opacity: hasCastle ? 1 : 0.3 }}
                      >
                        <Castle size={11} color="#a78bfa" />
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 700, fontFamily: "monospace", color: "#a78bfa" }}
                        >
                          {formatTroops(soloPower)}
                        </Typography>
                      </Box>
                    </Tooltip>
                  )}
                </Box>

                {/* Row 2: gold + tax% + pop */}
                <Box className="flex items-center justify-end gap-3 pl-7">
                  <Box className="flex items-center gap-0.5">
                    <Coins size={11} color="#f59e0b" />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#f59e0b" }}>
                      {formatGold(gold_ledger[c] || 0)}
                    </Typography>
                    {/* Tax rate badge — public ledger value */}
                    {(() => {
                      const rate = effectiveTaxRate(c);
                      const displayPct = Math.round(rate * 50);  // 1.0 rate → 50% display
                      const col = displayPct >= 50 ? "#4ade80" : displayPct >= 25 ? "#fbbf24" : "#f87171";
                      const pop = pop_ledger[c] || 0;
                      const income = Math.round(pop * 1000 * rate);
                      const incomeStr = income >= 1000 ? `${(income/1000).toFixed(1)}K` : `${income}`;
                      return (
                        <Tooltip
                          title={`Tax ${displayPct}% · income: ${incomeStr}/tick (50%=base, 100%=2×)`}
                          placement="top" arrow
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 700,
                              fontFamily: "monospace",
                              color: col,
                              fontSize: "0.62rem",
                              px: 0.4,
                              py: 0.1,
                              borderRadius: 0.5,
                              border: `1px solid ${col}44`,
                              lineHeight: 1.2,
                              cursor: "default",
                            }}
                          >
                            {displayPct}%
                          </Typography>
                        </Tooltip>
                      );
                    })()}
                  </Box>

                  <Box className="flex items-center gap-0.5">
                    <Users size={11} color="#60a5fa" />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#60a5fa" }}>
                      {pop_ledger[c] || 0}M
                    </Typography>
                  </Box>

                  <Tooltip
                    title={
                      belowLimit
                        ? `Happiness ${happiness} — below limit (${game_parameters.happiness_limit})`
                        : `Happiness ${happiness}/100`
                    }
                    placement="top"
                    arrow
                  >
                    <Box className="flex items-center gap-0.5">
                      <Smile size={11} color={belowLimit ? "#f87171" : "#34d399"} />
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          color: belowLimit ? "error.light" : "#34d399",
                        }}
                      >
                        {happiness}
                      </Typography>
                    </Box>
                  </Tooltip>
                </Box>

                {/* Row 3: rivals */}
                <Box className="flex items-center justify-end gap-1 pl-7">
                  <Swords size={11} color="#f472b6" />
                  {rivals.length === 0 ? (
                    <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>
                      No rivals
                    </Typography>
                  ) : (
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#f472b6" }}>
                      {rivals.join(", ")}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
};

export default NationalStatistics;
