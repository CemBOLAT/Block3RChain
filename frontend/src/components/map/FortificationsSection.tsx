import React from "react";
import { Box, Chip, MenuItem, Tooltip, Typography } from "@mui/material";
import { Castle, Hammer, Shield } from "lucide-react";
import type { CastleLevel, GameParameters } from "@/types/gameParameters";

type FortificationsSectionProps = {
  isSimulationMember: boolean;
  countryName: string;
  countryCastles: number[];
  game_parameters: GameParameters;
  step: number;
  canAffordL1: boolean;
  canAffordL2: boolean;
  canAffordL3: boolean;
  onBuild: (countryName: string, level: number) => void;
  onDemolish: (countryName: string, level: number) => void;
  onClose: () => void;
};

const FortificationsSection: React.FC<FortificationsSectionProps> = ({
  isSimulationMember,
  countryName,
  countryCastles,
  game_parameters,
  step,
  canAffordL1,
  canAffordL2,
  canAffordL3,
  onBuild,
  onDemolish,
  onClose,
}) => {
  if (!isSimulationMember) return null;

  const castleL1 = game_parameters.castles[1];
  const castleL2 = game_parameters.castles[2];
  const castleL3 = game_parameters.castles[3];

  const buildOptions = [
    { level: 1, canAfford: canAffordL1, castle: castleL1, iconClass: "text-sky-400", label: "Tier 1 Outpost" },
    { level: 2, canAfford: canAffordL2, castle: castleL2, iconClass: "text-amber-400", label: "Tier 2 Keep" },
    { level: 3, canAfford: canAffordL3, castle: castleL3, iconClass: "text-red-400", label: "Tier 3 Fortress" },
  ] as const;

  return (
    <Box className="py-0.5">
      <Box className="px-4 py-1.5 flex items-center justify-between">
        <Typography
          variant="overline"
          className="!leading-none text-[10px] flex items-center gap-1"
          sx={{ color: "text.secondary", fontWeight: 700 }}
        >
          <Castle size={12} className="text-indigo-400" /> Fortifications
        </Typography>
        <Chip
          size="small"
          label={`${countryCastles.length} Built`}
          color="primary"
          variant="outlined"
          sx={{ height: 16, fontSize: "0.6rem", fontWeight: 700 }}
        />
      </Box>

      {/* Active Castles list with Demolish option */}
      <Box className="px-4 pb-2 pt-0.5">
        {countryCastles.length > 0 ? (
          <Box className="flex flex-wrap gap-1">
            {countryCastles.map((lvl, index) => (
              <Tooltip
                key={`${lvl}-${index}`}
                title={`Defending with +${game_parameters.castles[lvl as CastleLevel].defense / 1000}K troops. Click X to demolish (no refund).`}
                arrow
                placement="top"
              >
                <Chip
                  size="small"
                  icon={<Shield size={10} />}
                  label={`Tier ${lvl}`}
                  color={lvl === 1 ? "info" : lvl === 2 ? "warning" : "error"}
                  onDelete={
                    step === 0
                      ? () => {
                          onDemolish(countryName, lvl);
                          onClose();
                        }
                      : undefined
                  }
                  sx={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    height: 20,
                  }}
                />
              </Tooltip>
            ))}
          </Box>
        ) : (
          <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>
            No fortifications.
          </Typography>
        )}
      </Box>

      {/* Construction options */}
      {step === 0 && (
        <Box className="flex px-2 pb-1 gap-1">
          {buildOptions.map(({ level, canAfford, castle, iconClass, label }) => (
            <MenuItem
              key={level}
              disabled={!canAfford}
              onClick={() => {
                onBuild(countryName, level);
                onClose();
              }}
              sx={{
                flex: 1,
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 1,
                px: 0.5,
                minHeight: 72,
                borderRadius: 1,
                textAlign: "center",
              }}
            >
              <Hammer size={16} className={iconClass} />
              <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.2, mt: 0.5 }}>
                {label}
              </Typography>
              <Box className="flex items-center gap-0.5">
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem", lineHeight: 1.2 }}>
                  {castle.build_cost / 1000}K 💰
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem", lineHeight: 1.2 }}>
                  +{castle.defense / 1000}K 🛡️
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default FortificationsSection;

