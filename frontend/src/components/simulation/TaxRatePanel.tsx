import React, { useState } from "react";
import {
  Box, Paper, Typography, Slider, Tooltip,
} from "@mui/material";
import { Coins, ChevronDown, ChevronUp } from "lucide-react";
import { formatGold } from "@/utils/formatUtils";
import { useSimulationStore } from "@/store/useSimulationStore";

// Gold income per million population at 100% tax rate
const INCOME_BASE = 1000;

export default function TaxRatePanel() {
  const { ledger, pop_ledger, tax_ledger, setTaxRate, step } = useSimulationStore();
  const [collapsed, setCollapsed] = useState(false);

  const countries = Object.keys(ledger);
  if (countries.length === 0) return null;

  const isCommitting = step !== 0;

  return (
    <Paper
      variant="outlined"
      className="flex flex-col gap-2 p-4"
      sx={{ bgcolor: "background.default" }}
    >
      {/* Header */}
      <Box
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setCollapsed((c) => !c)}
      >
        <Typography
          variant="overline"
          className="!font-bold flex items-center gap-2"
          sx={{ color: "text.secondary" }}
        >
          <Coins size={14} color="#f59e0b" /> Tax Rates
        </Typography>
        <Box className="flex items-center gap-1">
          <Tooltip
            title="Tax rate controls gold income per population. Lower tax = less income. Changes are mined into the blockchain on next commit."
            placement="top"
            arrow
          >
            <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.62rem", cursor: "help" }}>
              income/pop ℹ
            </Typography>
          </Tooltip>
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </Box>
      </Box>

      {!collapsed && (
        <Box className="flex flex-col gap-3">
          {countries.map((c) => {
            const pop = pop_ledger[c] || 0;
            const rate = tax_ledger[c] ?? 1.0;
            const income = Math.round(pop * INCOME_BASE * rate);
            const pct = Math.round(rate * 100);

            return (
              <Box key={c}>
                <Box className="flex items-center justify-between mb-0.5">
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: "primary.light", fontSize: "0.72rem" }}
                  >
                    {c}
                  </Typography>
                  <Box className="flex items-center gap-2">
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: "monospace",
                        fontWeight: 700,
                        color: pct >= 70 ? "#4ade80" : pct >= 40 ? "#fbbf24" : "#f87171",
                        fontSize: "0.72rem",
                      }}
                    >
                      {pct}%
                    </Typography>
                    <Tooltip title={`${pop}M pop × ${pct}% tax = ${formatGold(income)}/tick`} placement="top" arrow>
                      <Box className="flex items-center gap-0.5 cursor-help">
                        <Coins size={10} color="#f59e0b" />
                        <Typography variant="caption" sx={{ color: "#f59e0b", fontFamily: "monospace", fontSize: "0.68rem" }}>
                          {formatGold(income)}
                        </Typography>
                      </Box>
                    </Tooltip>
                  </Box>
                </Box>
                <Slider
                  size="small"
                  min={0}
                  max={100}
                  step={5}
                  value={pct}
                  disabled={isCommitting}
                  onChange={(_e, val) => {
                    const newRate = (val as number) / 100;
                    setTaxRate(c, newRate);
                  }}
                  sx={{
                    py: 0.5,
                    color: pct >= 70 ? "#4ade80" : pct >= 40 ? "#fbbf24" : "#f87171",
                    "& .MuiSlider-thumb": { width: 12, height: 12 },
                    "& .MuiSlider-rail": { opacity: 0.25 },
                  }}
                  marks={[
                    { value: 0, label: "" },
                    { value: 20, label: "" },
                    { value: 50, label: "" },
                    { value: 80, label: "" },
                    { value: 100, label: "" },
                  ]}
                />
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}
