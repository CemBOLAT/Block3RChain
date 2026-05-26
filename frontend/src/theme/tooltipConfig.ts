export const TOOLTIP_Z_INDEX = 10_000;

export const TOOLTIP_SLOT_PROPS = {
  popper: {
    sx: { zIndex: TOOLTIP_Z_INDEX },
  },
  tooltip: {
    sx: {
      maxWidth: 272,
      px: 1.5,
      py: 1.25,
      bgcolor: "background.paper",
      color: "text.secondary",
      border: "1px solid",
      borderColor: "divider",
      boxShadow: 6,
      typography: "caption",
      lineHeight: 1.55,
    },
  },
  arrow: {
    sx: {
      color: "background.paper",
      "&::before": {
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
        boxSizing: "border-box",
      },
    },
  },
} as const;
