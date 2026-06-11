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
    const pending = pendingInterventions.find((i) => i.type === "SET_TAX_RATE" && i.target === country);
    if (pending && pending.tax_rate != null) return pending.tax_rate as number;
    return tax_ledger[country] ?? 1.0;
  };

  return (
    <Box>
      <Paper variant="outlined" className="flex flex-col gap-2 p-4" sx={{ bgcolor: "background.default" }}>
        <Typography variant="overline" className="!font-bold flex items-center gap-2" sx={{ color: "text.secondary" }}>
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
                {/* Row 1: name only */}
                <Box className="flex items-center gap-1.5">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => removeCountry(c)}
                    sx={{ p: 0.2, flexShrink: 0 }}
                  >
                    <Trash2 size={15} />
                  </IconButton>

                  <Typography
                    sx={{ fontWeight: 800, color: "primary.light", flexShrink: 0, minWidth: 60, fontSize: "1rem" }}
                  >
                    {c}
                  </Typography>
                </Box>

                {/* Stats grid: 2 columns × 2 rows */}
                {(() => {
                  const rate = effectiveTaxRate(c);
                  const displayPct = Math.round(rate * 50);
                  const taxCol = displayPct >= 50 ? "#4ade80" : displayPct >= 25 ? "#fbbf24" : "#f87171";
                  const pop = pop_ledger[c] || 0;
                  const income = Math.round(pop * 1000 * rate);
                  const incomeStr = income >= 1000 ? `${(income / 1000).toFixed(1)}K` : `${income}`;
                  const happyCol = belowLimit ? "#f87171" : "#34d399";

                  const StatCell = ({
                    color,
                    icon,
                    label,
                    value,
                    sub,
                    tooltip,
                  }: {
                    color: string;
                    icon: React.ReactNode;
                    label: string;
                    value: React.ReactNode;
                    sub?: React.ReactNode;
                    tooltip?: string;
                  }) => (
                    <Tooltip title={tooltip ?? ""} placement="top" arrow disableHoverListener={!tooltip}>
                      <Box
                        sx={{
                          border: `1px solid ${color}55`,
                          borderRadius: 1,
                          px: 1,
                          py: 0.6,
                          bgcolor: `${color}0d`,
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.2,
                          minWidth: 0,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap", minWidth: 0 }}>
                          <Box
                            sx={{ display: "flex", alignItems: "center", gap: 0.4, color, opacity: 0.7, flexShrink: 0 }}
                          >
                            {icon}
                            <Typography
                              sx={{ fontSize: "0.72rem", fontWeight: 700, lineHeight: 1, letterSpacing: "0.04em" }}
                            >
                              {label}
                            </Typography>
                            <Typography
                              sx={{ fontSize: "0.72rem", fontWeight: 500, color, opacity: 0.5, lineHeight: 1 }}
                            >
                              :
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              fontWeight: 800,
                              fontFamily: "monospace",
                              color,
                              fontSize: "0.96rem",
                              lineHeight: 1,
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              flexWrap: "wrap",
                            }}
                          >
                            {value}
                          </Box>
                        </Box>
                        {sub && (
                          <Typography sx={{ fontSize: "0.62rem", color, opacity: 0.6, lineHeight: 1 }}>
                            {sub}
                          </Typography>
                        )}
                      </Box>
                    </Tooltip>
                  );

                  return (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 0.75,
                        mt: 0.5,
                      }}
                    >
                      <StatCell
                        color="#f43f5e"
                        icon={<Swords size={13} />}
                        label="TROOPS"
                        value={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                            <span>{formatTroops(troops)}</span>
                            {levels.map((lvl, idx) => {
                              const tierColor = lvl === 1 ? "#38bdf8" : lvl === 2 ? "#fbbf24" : "#f87171";
                              return (
                                <Box
                                  key={idx}
                                  sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    px: 0.5,
                                    py: 0.1,
                                    borderRadius: 0.5,
                                    border: `1px solid ${tierColor}55`,
                                    color: tierColor,
                                    flexShrink: 0,
                                  }}
                                >
                                  <Castle size={9} />
                                </Box>
                              );
                            })}
                          </Box>
                        }
                        tooltip={
                          hasCastle
                            ? `Attack: ${formatTroops(troops)} · Solo defense: ${formatTroops(soloPower)} (troops + castles)`
                            : undefined
                        }
                      />
                      <StatCell
                        color="#f59e0b"
                        icon={<Coins size={13} />}
                        label="GOLD"
                        value={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                            <span>{formatGold(gold_ledger[c] || 0)}</span>
                            <Typography
                              component="span"
                              sx={{
                                fontWeight: 700,
                                fontFamily: "monospace",
                                color: taxCol,
                                fontSize: "0.62rem",
                                px: 0.5,
                                py: 0.1,
                                borderRadius: 0.5,
                                border: `1px solid ${taxCol}55`,
                                lineHeight: 1.3,
                                cursor: "default",
                                flexShrink: 0,
                              }}
                            >
                              {displayPct}%
                            </Typography>
                          </Box>
                        }
                        tooltip={`Tax ${displayPct}% · income: ${incomeStr}/tick (50%=base, 100%=2×)`}
                      />
                      <StatCell color="#60a5fa" icon={<Users size={13} />} label="POPULATION" value={`${pop}M`} />
                      <StatCell
                        color={happyCol}
                        icon={<Smile size={13} />}
                        label="HAPPINESS"
                        value={happiness}
                        tooltip={belowLimit ? `⚠ below limit (${game_parameters.happiness_limit})` : undefined}
                      />
                    </Box>
                  );
                })()}

                {/* Row 3: rivals */}
                <Box className="flex items-center justify-start gap-1.5 pl-4 pt-1.5">
                  <Swords size={16} color="#f472b6" />
                  {rivals.length === 0 ? (
                    <Typography sx={{ color: "text.disabled", fontStyle: "italic", fontSize: "0.85rem" }}>
                      No rivals
                    </Typography>
                  ) : (
                    <Typography sx={{ fontWeight: 700, color: "#f472b6", fontSize: "0.95rem" }}>
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
