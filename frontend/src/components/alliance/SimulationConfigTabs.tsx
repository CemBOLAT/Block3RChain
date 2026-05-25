import React, { useState } from "react";
import { useTheme } from "@mui/material";
import AllianceParametersForm from "./AllianceParametersForm";
import GameParametersForm from "./GameParametersForm";
import { AllianceParameters } from "@/types/allianceParameters";
import { GameParameters } from "@/types/gameParameters";

const TAB_LABELS = ["Alliance Settings", "Game Settings"] as const;

export interface SimulationConfigTabsProps {
  allianceParameters: AllianceParameters;
  onAllianceParametersChange: (next: AllianceParameters) => void;
  gameParameters: GameParameters;
  onGameParametersChange: (next: GameParameters) => void;
  disabled?: boolean;
}

const SimulationConfigTabs: React.FC<SimulationConfigTabsProps> = ({
  allianceParameters,
  onAllianceParametersChange,
  gameParameters,
  onGameParametersChange,
  disabled = false,
}) => {
  const [tab, setTab] = useState(0);
  const theme = useTheme();

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" className="flex border-b border-slate-200 dark:border-slate-700">
        {TAB_LABELS.map((label, index) => {
          const selected = tab === index;
          return (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(index)}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                selected
                  ? "border-b-2"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
              style={
                selected ? { color: theme.palette.primary.main, borderColor: theme.palette.primary.main } : undefined
              }
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="pt-2" role="tabpanel">
        {tab === 0 ? (
          <AllianceParametersForm
            value={allianceParameters}
            onChange={onAllianceParametersChange}
            disabled={disabled}
          />
        ) : (
          <GameParametersForm value={gameParameters} onChange={onGameParametersChange} disabled={disabled} />
        )}
      </div>
    </div>
  );
};

export default SimulationConfigTabs;
