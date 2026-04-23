import React, { createContext, useContext, useState } from "react";
import { Simulation } from "@/types/simulation";

interface GameSetupContextType {
  editableName: string;
  editableNations: Record<string, number>;
  baseSim: Simulation | null;
  setEditableName: (name: string) => void;
  handleTemplateSelect: (sim: Simulation) => void;
  handleTroopChange: (nation: string, count: number) => void;
  handleRemoveNation: (nation: string) => void;
}

const GameSetupContext = createContext<GameSetupContextType | undefined>(undefined);

export const GameSetupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [baseSim, setBaseSim] = useState<Simulation | null>(null);
  const [editableName, setEditableName] = useState("");
  const [editableNations, setEditableNations] = useState<Record<string, number>>({});

  const handleTemplateSelect = (sim: Simulation) => {
    setBaseSim(sim);
    setEditableName(sim.name);
    setEditableNations({ ...sim.nations });
  };

  const handleTroopChange = (nation: string, count: number) => {
    setEditableNations((prev) => ({
      ...prev,
      [nation]: Math.max(0, count),
    }));
  };

  const handleRemoveNation = (nation: string) => {
    setEditableNations((prev) => {
      const next = { ...prev };
      delete next[nation];
      return next;
    });
  };

  const isInNationList = (nation: string) => {
    return editableNations[nation] !== undefined;
  };

  return (
    <GameSetupContext.Provider
      value={{
        editableName,
        editableNations,
        baseSim,
        setEditableName,
        handleTemplateSelect,
        handleTroopChange,
        handleRemoveNation,
        isInNationList,
      }}
    >
      {children}
    </GameSetupContext.Provider>
  );
};

export const useGameSetup = () => {
  const context = useContext(GameSetupContext);
  if (!context) {
    throw new Error("useGameSetup must be used within a GameSetupProvider");
  }
  return context;
};
