import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import { ChevronUp, Sliders } from "lucide-react";
import SimulationConfigTabs from "@/components/alliance/SimulationConfigTabs";
import { AllianceParameters } from "@/types/allianceParameters";
import { GameParameters } from "@/types/gameParameters";
import { useSimulationStore } from "@/store/useSimulationStore";

const COLLAPSED_SIZE = 40;
const TOOLTIP_Z_INDEX = 10_000;

const AllianceConfigPanel: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [allianceDraft, setAllianceDraft] = useState<AllianceParameters | null>(null);
  const [gameDraft, setGameDraft] = useState<GameParameters | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const step = useSimulationStore((s) => s.step);
  const alliance_parameters = useSimulationStore((s) => s.alliance_parameters);
  const game_parameters = useSimulationStore((s) => s.game_parameters);
  const updateAllianceParameters = useSimulationStore((s) => s.updateAllianceParameters);
  const updateGameParameters = useSimulationStore((s) => s.updateGameParameters);

  const atEquilibrium = step === 0;

  useEffect(() => {
    if (expanded) {
      setAllianceDraft({ ...alliance_parameters });
      setGameDraft({ ...game_parameters });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- parameters read at open time only
  }, [expanded]);

  const handleSubmit = async () => {
    if (!allianceDraft || !gameDraft || !atEquilibrium) return;
    setSubmitting(true);
    try {
      await Promise.all([
        updateAllianceParameters(allianceDraft),
        updateGameParameters(gameDraft),
      ]);
      setExpanded(false);
    } catch {
      // toast handled in store
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper
      elevation={4}
      sx={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 9998,
        width: expanded ? 360 : COLLAPSED_SIZE,
        maxWidth: "calc(100vw - 48px)",
        overflow: expanded ? "visible" : "hidden",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      {!expanded ? (
        <Tooltip
          title="Game & Alliance Parameters"
          placement="left"
          arrow
          slotProps={{ popper: { sx: { zIndex: TOOLTIP_Z_INDEX } } }}
        >
          <IconButton
            onClick={() => setExpanded(true)}
            aria-label="Open alliance parameters"
            sx={{
              width: COLLAPSED_SIZE,
              height: COLLAPSED_SIZE,
              borderRadius: 1,
            }}
          >
            <Sliders size={18} />
          </IconButton>
        </Tooltip>
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              px: 1.5,
              py: 1,
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Simulation Parameters
            </Typography>
            <IconButton
              size="small"
              onClick={() => setExpanded(false)}
              aria-label="Collapse parameters"
            >
              <ChevronUp size={18} />
            </IconButton>
          </Box>

          <Box sx={{ px: 2, pb: 2, pt: 1.5 }}>
            {allianceDraft && gameDraft && (
              <SimulationConfigTabs
                allianceValue={allianceDraft}
                onAllianceChange={setAllianceDraft}
                gameValue={gameDraft}
                onGameChange={setGameDraft}
                disabled={!atEquilibrium || submitting}
              />
            )}

            {!atEquilibrium && (
              <Typography variant="caption" color="warning.main" sx={{ display: "block", mt: 1 }}>
                Parameters can only be updated at equilibrium.
              </Typography>
            )}

            <Button
              fullWidth
              variant="contained"
              size="small"
              sx={{ mt: 1.5, textTransform: "none" }}
              disabled={!atEquilibrium || submitting || !allianceDraft || !gameDraft}
              onClick={handleSubmit}
            >
              Update parameters
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default AllianceConfigPanel;
