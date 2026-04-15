"use client"

import { Box } from '@mui/material'
import { Sun, Moon } from 'lucide-react'

const TOGGLE_DIMENSIONS = {
  width: 64,
  height: 32,
  thumbSize: 26,
  padding: 2,
}

const TOGGLE_COLORS = {
  dark: {
    bg: '#0f172a',
    border: '#334155',
    icon: 'white'
  },
  light: {
    bg: '#f97316',
    border: '#ea580c',
    icon: 'white'
  }
}

interface ThemeToggleProps {
  mode: 'light' | 'dark'
  toggleMode: () => void
}

export default function ThemeToggle({ mode, toggleMode }: ThemeToggleProps) {
  const isDark = mode === 'dark';
  const colors = isDark ? TOGGLE_COLORS.dark : TOGGLE_COLORS.light;
  
  // Calculate left positions to avoid hard-coded logic
  // (Total Width) - (Thumb Size) - (Padding on right) - (2x Border thickness)
  const leftPositionDark = TOGGLE_DIMENSIONS.width - TOGGLE_DIMENSIONS.thumbSize - TOGGLE_DIMENSIONS.padding - 2;
  const leftPositionLight = TOGGLE_DIMENSIONS.padding;

  return (
    <Box
      onClick={toggleMode}
      sx={{
        width: TOGGLE_DIMENSIONS.width,
        height: TOGGLE_DIMENSIONS.height,
        borderRadius: TOGGLE_DIMENSIONS.height / 2,
        bgcolor: colors.bg, 
        border: '1px solid',
        borderColor: colors.border,
        position: 'relative',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 1,
        transition: 'background-color 0.3s, border-color 0.3s',
      }}
    >
      <Moon size={16} color={TOGGLE_COLORS.dark.icon} style={{ zIndex: 1, opacity: isDark ? 1 : 0, transition: 'opacity 0.3s' }} />
      <Sun size={16} color={TOGGLE_COLORS.light.icon} style={{ zIndex: 1, opacity: isDark ? 0 : 1, transition: 'opacity 0.3s' }} />
      
      {/* The sliding thumb */}
      <Box
        sx={{
          width: TOGGLE_DIMENSIONS.thumbSize,
          height: TOGGLE_DIMENSIONS.thumbSize,
          borderRadius: '50%',
          bgcolor: 'white',
          position: 'absolute',
          top: TOGGLE_DIMENSIONS.padding,
          left: isDark ? leftPositionDark : leftPositionLight,
          transition: 'left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          zIndex: 2
        }}
      />
    </Box>
  )
}
