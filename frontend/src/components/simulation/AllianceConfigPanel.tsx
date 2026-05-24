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
import AllianceParametersForm from "@/components/alliance/AllianceParametersForm";
import { AllianceParameters } from "@/types/allianceParameters";
import { useSimulationStore } from "@/store/useSimulationStore";

const COLLAPSED_SIZE = 40;
const TOOLTIP_Z_INDEX = 10_000;

const AllianceConfigPanel: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<AllianceParameters | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const step = useSimulationStore((s) => s.step);
  const alliance_parameters = useSimulationStore((s) => s.alliance_parameters);
  const updateAllianceParameters = useSimulationStore((s) => s.updateAllianceParameters);

  const atEquilibrium = step === 0;

  useEffect(() => {
    if (expanded) {
      setDraft({ ...alliance_parameters });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- alliance_parameters read at open time only
  }, [expanded]);

  const handleSubmit = async () => {
    if (!draft || !atEquilibrium) return;
    setSubmitting(true);
    try {
      await updateAllianceParameters(draft);
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
        width: expanded ? 320 : COLLAPSED_SIZE,
        maxWidth: "calc(100vw - 48px)",
        overflow: expanded ? "visible" : "hidden",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      {!expanded ? (
        <Tooltip
          title="Alliance parameters"
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
              Alliance Parameters
            </Typography>
            <IconButton
              size="small"
              onClick={() => setExpanded(false)}
              aria-label="Collapse alliance parameters"
            >
              <ChevronUp size={18} />
            </IconButton>
          </Box>

          <Box sx={{ px: 2, pb: 2, pt: 1.5 }}>
            {draft && (
              <AllianceParametersForm
                value={draft}
                onChange={setDraft}
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
              disabled={!atEquilibrium || submitting || !draft}
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
