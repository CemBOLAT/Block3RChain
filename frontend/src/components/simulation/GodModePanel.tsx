"use client"

import { useState } from "react"
import { useSimulationStore } from "@/store/useSimulationStore"
import { 
  Card, CardContent, Typography, Box, TextField, Button, Divider, Paper, ToggleButton,
  ToggleButtonGroup, IconButton, Autocomplete 
} from "@mui/material"
import { Sword, Shield, Zap, Link as LinkIcon, Globe, Plus, Trash2 } from "lucide-react"
import { COUNTRY_COORDS } from "@/utils/mapUtils"

import { formatTroops, roundTroops } from "@/utils/formatUtils"

export default function GodModePanel() {
  const { step, ledger, alliances, chain_length, triggerGodIntervention,
    addCountry, removeCountry } = useSimulationStore()
  const [selectedCountry, setSelectedCountry] = useState("")
  const [troopAmount, setTroopAmount] = useState(5000)
  const [actionType, setActionType] = useState<"add" | "remove">("add")

  const [newCountryName, setNewCountryName] = useState("")
  const [newCountryTroops, setNewCountryTroops] = useState(10000)

  const handleIntervention = () => {
    if (!selectedCountry) return
    // "Binize et" and "Maximüm yüzler basamağı" constraint applied on send
    const roundedAmount = roundTroops(troopAmount)
    const finalAmount = actionType === "add" ? roundedAmount : -roundedAmount
    triggerGodIntervention(selectedCountry, finalAmount)
  }

  const handleAddCountry = () => {
    if (!newCountryName) return
    // "Binize et" and "Maximüm yüzler basamağı" constraint applied on send
    const roundedTroops = roundTroops(newCountryTroops)
    addCountry(newCountryName, roundedTroops)
    setNewCountryName("")
  }



  return (
    <Card elevation={6} sx={{ width: '100%', maxWidth: 450, bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', flexGrow: 1, overflowY: 'auto' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
        
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              Exogenous Shock
            </Typography>
            
            <ToggleButtonGroup
              size="small"
              value={actionType}
              exclusive
              onChange={(_, val) => val && setActionType(val)}
              sx={{ height: 32 }}
            >
              <ToggleButton value="add" sx={{ px: 2, textTransform: 'none', fontWeight: 'bold' }}>
                Add
              </ToggleButton>
              <ToggleButton value="remove" sx={{ px: 2, textTransform: 'none', fontWeight: 'bold' }}>
                Remove
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          
          <Autocomplete
            size="small"
            options={Object.keys(ledger)}
            value={selectedCountry && Object.keys(ledger).includes(selectedCountry) ? selectedCountry : null}
            onChange={(_, newValue) => setSelectedCountry(newValue || "")}
            renderInput={(params) => (
              <TextField {...params} placeholder={Object.keys(ledger).length > 0 ? "Search country in ledger..." : "Waiting for simulation..."} />
            )}
            disabled={Object.keys(ledger).length === 0}
          />

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField 
              size="small"
              type="number" 
              value={troopAmount}
              onChange={(e) => setTroopAmount(Math.abs(Number(e.target.value)))}
              sx={{ flexGrow: 1, minWidth: 150 }}
              slotProps={{ htmlInput: { min: 0 } }}
            />
            <Button 
              variant="contained" 
              color={actionType === "add" ? "success" : "error"}
              onClick={handleIntervention}
              disabled={step !== 0 || !selectedCountry}
              startIcon={actionType === "add" ? <Zap size={16} /> : <Sword size={16} />}
              sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', minWidth: 100 }}
            >
              {actionType === "add" ? "Bless!" : "Smite!"}
            </Button>
          </Box>
        </Paper>
        {/* Dynamic World Management (Add Country) */}
        <Paper variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, borderStyle: 'dashed' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Globe size={16} /> Manage World (Add nations)
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Autocomplete
              size="small"
              options={Object.keys(COUNTRY_COORDS)}
              value={newCountryName}
              onChange={(_, newValue) => setNewCountryName(newValue || "")}
              onInputChange={(_, newInputValue) => setNewCountryName(newInputValue)}
              sx={{ flexGrow: 1 }}
              renderInput={(params) => (
                <TextField {...params} placeholder="Search Country..." />
              )}
            />
            <TextField 
              size="small"
              type="number"
              value={newCountryTroops}
              onChange={(e) => setNewCountryTroops(Number(e.target.value))}
              sx={{ width: 140 }}
              slotProps={{ htmlInput: { min: 0 } }}
            />
            <Button 
              size="small"
              variant="outlined"
              onClick={handleAddCountry}
              startIcon={<Plus size={16} />}
              sx={{ fontWeight: 'bold', px: 2 }}
            >
              Add
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton size="small" color="error" onClick={() => removeCountry(c)} sx={{ p: 0.5 }}>
                        <Trash2 size={12} />
                      </IconButton>
                      <Typography variant="body2" color="primary.light">{c}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{formatTroops(val)}</Typography>
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
