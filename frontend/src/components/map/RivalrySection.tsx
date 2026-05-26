import React from "react";
import { Box, Chip, Divider, Typography } from "@mui/material";
import { Plus, Swords } from "lucide-react";

type RivalrySectionProps = {
  isSimulationMember: boolean;
  step: number;
  countryName: string;
  rivals: string[];
  nonRivals: string[];
  onAddRival: (rivalId: string) => void;
  onRemoveRival: (rivalId: string) => void;
};

const RivalrySection: React.FC<RivalrySectionProps> = ({
  isSimulationMember,
  step,
  countryName,
  rivals,
  nonRivals,
  onAddRival,
  onRemoveRival,
}) => {
  if (!isSimulationMember) return null;

  const canEdit = step === 0;

  return (
    <Box className="py-0.5">
      <Divider className="!my-1" />
      <Box className="px-4 py-1.5">
        <Typography
          variant="overline"
          className="!leading-none text-[10px] flex items-center gap-1"
          sx={{ color: "text.secondary", fontWeight: 700 }}
        >
          <Swords size={12} color="#f472b6" /> Rivalry
        </Typography>
      </Box>

      <Box className="px-4 pb-1.5">
        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, display: "block", mb: 0.75 }}>
          Rivals
        </Typography>
        {rivals.length === 0 ? (
          <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>
            No rivals for {countryName}.
          </Typography>
        ) : (
          <Box className="flex flex-wrap gap-1">
            {rivals.map((rival) => (
              <Chip
                key={rival}
                label={rival}
                size="small"
                onDelete={canEdit ? () => onRemoveRival(rival) : undefined}
                sx={{
                  bgcolor: "error.main",
                  color: "error.contrastText",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  height: 22,
                  "& .MuiChip-deleteIcon": {
                    color: "error.contrastText",
                    opacity: 0.9,
                    "&:hover": { color: "error.contrastText", opacity: 1 },
                  },
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      <Box className="px-4 pb-2">
        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, display: "block", mb: 0.75 }}>
          Non-Rivals
        </Typography>
        {nonRivals.length === 0 ? (
          <Typography variant="caption" sx={{ color: "text.disabled", fontStyle: "italic" }}>
            No other nations available.
          </Typography>
        ) : (
          <Box className="flex flex-wrap gap-1">
            {nonRivals.map((nation) => (
              <Chip
                key={nation}
                label={nation}
                size="small"
                onDelete={canEdit ? () => onAddRival(nation) : undefined}
                deleteIcon={<Plus size={12} />}
                sx={{
                  bgcolor: "success.main",
                  color: "success.contrastText",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  height: 22,
                  "& .MuiChip-deleteIcon": {
                    color: "success.contrastText",
                    opacity: 0.9,
                    "&:hover": { color: "success.contrastText", opacity: 1 },
                  },
                }}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default RivalrySection;
