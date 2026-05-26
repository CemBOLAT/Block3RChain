import React from "react";
import { useTheme } from "@mui/material";
import ParameterHelpTooltip from "@/components/common/ParameterHelpTooltip";
import { AllianceStrategy, ALLIANCE_STRATEGY_HELP, ALLIANCE_STRATEGY_OPTIONS } from "@/types/allianceParameters";

export interface AllianceStrategySelectorProps {
  value: AllianceStrategy;
  onChange: (strategy: AllianceStrategy) => void;
  disabled?: boolean;
}

const AllianceStrategySelector: React.FC<AllianceStrategySelectorProps> = ({ value, onChange, disabled = false }) => {
  const theme = useTheme();

  return (
    <div className="mb-2 flex flex-col gap-1">
      <div className="flex min-w-0 items-center">
        <span className="text-sm font-semibold">{ALLIANCE_STRATEGY_HELP.label}</span>
        <ParameterHelpTooltip label={ALLIANCE_STRATEGY_HELP.label} text={ALLIANCE_STRATEGY_HELP.tooltip} />
      </div>

      <div
        role="group"
        aria-label={ALLIANCE_STRATEGY_HELP.label}
        className="mt-1 flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700"
      >
        {ALLIANCE_STRATEGY_OPTIONS.map(({ value: optionValue, label }) => {
          const selected = value === optionValue;
          return (
            <button
              key={optionValue}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => onChange(optionValue)}
              className={`flex-1 rounded-md px-2 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                selected ? "" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              style={
                selected
                  ? {
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                    }
                  : undefined
              }
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AllianceStrategySelector;
