"use client"

import { useState } from "react"
import { useSimulationStore } from "@/store/useSimulationStore"
import { Sword, Shield, Zap, Link as LinkIcon } from "lucide-react"
import { 
  Card, CardContent, Typography, Box, Select, MenuItem, TextField, Button, Divider, Paper 
} from "@mui/material"

export default function GodModePanel() {
  const { step, ledger, alliances, chain_length, triggerGodIntervention } = useSimulationStore()
  const [selectedCountry, setSelectedCountry] = useState("Türkiye")
  const [troopAmount, setTroopAmount] = useState(5000)

  const handleIntervention = () => {
    triggerGodIntervention(selectedCountry, troopAmount)
  }

  return (
    <Card elevation={6} sx={{ width: '100%', maxWidth: 450, bgcolor: 'background.paper' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        
        {/* Header */}
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Zap color="#facc15" size={24} />
            God-Mode Panel
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Current Phase Execution: Step {step}
          </Typography>
        </Box>

        {/* Intervention Form */}
        <Paper variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: 'background.default' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            Exogenous Shock (Inject Troops)
          </Typography>
          
          <Select 
            size="small"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value as string)}
            displayEmpty
          >
            {Object.keys(ledger).length > 0 ? (
              Object.keys(ledger).map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)
            ) : (
              <MenuItem value="Türkiye">Loading...</MenuItem>
            )}
          </Select>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField 
              size="small"
              type="number" 
              value={troopAmount}
              onChange={(e) => setTroopAmount(Number(e.target.value))}
              fullWidth
            />
            <Button 
              variant="contained" 
              color="error"
              onClick={handleIntervention}
              disabled={step !== 0}
              startIcon={<Sword size={16} />}
              sx={{ whiteSpace: 'nowrap', fontWeight: 'bold' }}
            >
              Smite!
            </Button>
          </Box>
        </Paper>

        {/* Ledger & Info */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          <Box>
            <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Shield size={14} /> Troop Ledger
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {Object.entries(ledger).map(([c, val]) => (
                  <Box key={c} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="primary.light">{c}</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{val.toLocaleString()}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>

          <Box>
            <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                 <LinkIcon size={14} /> Alliances
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, color: 'success.light' }}>
                 {alliances.length > 0 ? alliances.map(a => <Typography key={a} variant="body2">{a}</Typography>) : <Typography variant="body2" color="text.secondary">None</Typography>}
              </Box>
              
              <Box sx={{ mt: 'auto', pt: 2 }}>
                <Divider sx={{ mb: 1 }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Chain Length</Typography>
                <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>{chain_length}</Typography>
              </Box>
            </Paper>
          </Box>
        </Box>

      </CardContent>
    </Card>
  )
}
