import React from "react";
import { Box, Divider, Slider, Tooltip, Typography } from "@mui/material";
import { Coins } from "lucide-react";

type TaxRateSectionProps = {
  isSimulationMember: boolean;
  step: number;
  countryName: string;
  pop: number;
  draftTaxPct: number;
  setDraftTaxPct: (val: number) => void;
  sliderToRate: (s: number) => number;
  onCommitRate: (countryName: string, rate: number) => void;
};

const TaxRateSection: React.FC<TaxRateSectionProps> = ({
  isSimulationMember,
  step,
  countryName,
  pop,
  draftTaxPct,
  setDraftTaxPct,
  sliderToRate,
  onCommitRate,
}) => {
  if (!isSimulationMember || step !== 0) return null;

  const col = draftTaxPct >= 50 ? "#4ade80" : draftTaxPct >= 25 ? "#fbbf24" : "#f87171";
  const income = Math.round(pop * 1000 * sliderToRate(draftTaxPct));
  const incomeStr = income >= 1000 ? `${(income / 1000).toFixed(1)}K` : `${income}`;

  return (
    <Box className="py-0.5">
      <Divider className="!my-1" />
      <Box className="px-4 py-1.5 flex items-center justify-between">
        <Typography
          variant="overline"
          className="!leading-none text-[10px] flex items-center gap-1"
          sx={{ color: "text.secondary", fontWeight: 700 }}
        >
          <Coins size={12} color="#f59e0b" /> Tax Rate
        </Typography>

        <Tooltip
          title={`${draftTaxPct}% slider · ${pop}M pop → ${incomeStr} gold/tick | 50%=base income, 100%=2× income`}
          placement="top"
          arrow
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: 900, fontFamily: "monospace", color: col, cursor: "help" }}
          >
            {draftTaxPct}%
          </Typography>
        </Tooltip>
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
          onChangeCommitted={(_e, val) => onCommitRate(countryName, sliderToRate(val as number))}
          sx={{
            py: 0.5,
            color: col,
            "& .MuiSlider-thumb": { width: 14, height: 14 },
            "& .MuiSlider-rail": { opacity: 0.25 },
          }}
        />
        <Box className="flex justify-between">
          <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.6rem" }}>
            0% — no income
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.6rem", fontWeight: 700 }}>
            50% = base
          </Typography>
          <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.6rem" }}>
            100% = 2×
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default TaxRateSection;

