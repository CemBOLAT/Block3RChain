"use client"

import { useEffect } from "react"
import { useSimulationStore } from "@/store/useSimulationStore"
import GodModePanel from "@/components/GodModePanel"
import dynamic from "next/dynamic"
import { GitBranch } from "lucide-react"

// Import graph dynamically avoiding SSR window errors
const NetworkMap = dynamic(() => import("@/components/NetworkMap"), { ssr: false })

import { ThemeProvider, createTheme, CssBaseline, Box, Paper, Typography } from '@mui/material'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#020617', // slate-950
      paper: '#0f172a',   // slate-900
    },
  },
  typography: {
    fontFamily: 'inherit',
  },
})

export default function Home() {
  const { step, fetchState, mempool, connectWebSocket } = useSimulationStore()

  useEffect(() => {
    // Ilk state'i çek, ardindan Polling yerine WebSocket'e baglan
    fetchState()
    connectWebSocket()
  }, [fetchState, connectWebSocket])

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', display: 'flex', gap: 4, p: 4, overflow: 'hidden' }}>
        
        {/* Left Sidebar: God Mode Controls */}
        <Box sx={{ width: 450, height: '100%', display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
          <GodModePanel />
          
          {/* Pipeline Info */}
          <Paper elevation={6} sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                <GitBranch size={20} /> Pipeline
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  bgcolor: step === 0 ? 'success.dark' : 'warning.dark',
                  color: step === 0 ? 'success.light' : 'warning.light',
                  px: 1, py: 0.5, borderRadius: 1, fontFamily: 'monospace', fontWeight: 'bold'
                }}
              >
                {step === 0 ? "EQUILIBRIUM" : `STEP ${step}/15`}
              </Typography>
            </Box>
            
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                bgcolor: 'black', 
                color: 'text.secondary', 
                fontFamily: 'monospace', 
                fontSize: '0.875rem', 
                overflowX: 'auto',
                whiteSpace: 'pre'
              }}
            >
              {mempool ? JSON.stringify(mempool, null, 2) : "Awaiting God Intervention..."}
            </Paper>
          </Paper>
        </Box>

        {/* Main Content Area (D3 Map) */}
        <Paper 
          elevation={6} 
          sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            position: 'relative', 
            overflow: 'hidden' 
          }}
        >
          <NetworkMap />
        </Paper>

      </Box>
    </ThemeProvider>
  )
}


