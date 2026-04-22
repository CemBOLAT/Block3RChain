import React, { useState, useCallback, useEffect, ReactNode, useRef } from "react";
import { Box } from "@mui/material";

interface ResizablePanelProps {
  children: ReactNode;
  initialWidth: number;
  minWidth: number;
  maxWidth: number;
  isCollapsed: boolean;
}

const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  initialWidth,
  minWidth,
  maxWidth,
  isCollapsed,
}) => {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing && containerRef.current) {
        const parentRect = containerRef.current.parentElement?.getBoundingClientRect();
        if (parentRect) {
          // Adjust width based on mouse position relative to the container's start
          const newWidth = e.clientX - parentRect.left - (parseInt(getComputedStyle(containerRef.current.parentElement!).paddingLeft) || 0);
          if (newWidth >= minWidth && newWidth <= maxWidth) {
            setWidth(newWidth);
          }
        }
      }
    },
    [isResizing, minWidth, maxWidth]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  return (
    <Box
      ref={containerRef}
      sx={{
        display: "flex",
        height: "100%",
        userSelect: isResizing ? "none" : "auto",
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          width: isCollapsed ? 0 : width,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          transition: isResizing ? "none" : "width 0.3s ease",
          overflow: "hidden",
          visibility: isCollapsed ? "hidden" : "visible",
          opacity: isCollapsed ? 0 : 1,
        }}
      >
        {children}
      </Box>
      {!isCollapsed && (
        <Box
          onMouseDown={startResizing}
          sx={{
            width: "4px",
            cursor: "col-resize",
            bgcolor: isResizing ? "primary.main" : "transparent",
            "&:hover": {
              bgcolor: "primary.main",
            },
            transition: "background-color 0.2s",
            mx: 2,
            borderRadius: "2px",
            flexShrink: 0,
          }}
        />
      )}
    </Box>
  );
};

export default ResizablePanel;
