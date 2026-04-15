import { createTheme } from '@mui/material/styles'

export const THEME_COLORS = {
  dark: {
    background: '#020617', // slate-950
    paper: '#0f172a',      // slate-900
  },
  light: {
    background: '#f8fafc', // slate-50
    paper: '#ffffff',      // white
  }
}

export const getAppTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    background: {
      default: THEME_COLORS[mode].background,
      paper: THEME_COLORS[mode].paper,
    }
  },
  typography: {
    fontFamily: 'inherit',
  },
})
