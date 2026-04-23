"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  useTheme,
} from "@mui/material";
import { AlertCircle } from "lucide-react";
import { useErrorStore } from "@/store/useErrorStore";

const ErrorModal: React.FC = () => {
  const { isOpen, message, title, showCloseButton, closeError } = useErrorStore();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Dialog
      open={isOpen}
      onClose={showCloseButton ? closeError : undefined}
      aria-labelledby="error-dialog-title"
      aria-describedby="error-dialog-description"
      disableEscapeKeyDown={!showCloseButton}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            padding: 1,
            minWidth: { xs: "90%", sm: 400 },
            background: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
            color: theme.palette.text.primary,
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
          },
        },
      }}
    >
      <DialogTitle id="error-dialog-title" sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <AlertCircle color={theme.palette.error.main} size={24} />
        <Typography component="span" variant="h6" fontWeight="600" sx={{ color: theme.palette.error.main }}>
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="error-dialog-description" sx={{ color: theme.palette.text.secondary }}>
          {message}
        </DialogContentText>
      </DialogContent>
      {showCloseButton && (
        <DialogActions sx={{ padding: 2 }}>
          <Button
            onClick={closeError}
            variant="contained"
            sx={{
              backgroundColor: theme.palette.error.main,
              "&:hover": { backgroundColor: theme.palette.error.dark },
              borderRadius: 2,
              textTransform: "none",
              fontWeight: "bold",
            }}
          >
            Close
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ErrorModal;
