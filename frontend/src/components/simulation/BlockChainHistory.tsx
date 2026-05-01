import React, { useState, useEffect } from "react";
import { Box, IconButton, Typography, Card, CardContent, Grid, Chip, Tooltip, Collapse } from "@mui/material";
import {
  X,
  Database,
  Box as BoxIcon,
  Terminal,
  ChevronDown,
  ChevronUp,
  GitBranch,
  Coins,
  Users,
  Skull,
  Sword,
} from "lucide-react";
import { useSimulationStore } from "@/store/useSimulationStore";
import { formatDateTime, formatTroops, formatGold } from "@/utils/formatUtils";

interface BlockChainHistoryProps {
  onClose: () => void;
}

const BlockChainHistory: React.FC<BlockChainHistoryProps> = ({ onClose }) => {
  const { chain, fetchChain } = useSimulationStore();
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);

  useEffect(() => {
    fetchChain();
  }, [fetchChain]);

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1100,
        bgcolor: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        flexDirection: "column",
        p: 3,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 4, color: "white" }}>
        <IconButton
          onClick={onClose}
          sx={{
            bgcolor: "background.paper",
            boxShadow: 2,
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <X size={24} />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 2 }}>
          <Database size={32} color="#3b82f6" /> Blockchain Explorer
        </Typography>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          pr: 1,
        }}
      >
        {chain.map((block) => (
          <Card
            key={block.index}
            elevation={4}
            sx={{
              borderLeft: "6px solid",
              borderColor: block.index === 0 ? "warning.main" : "primary.main",
              bgcolor: "background.paper",
              flexShrink: 0,
            }}
          >
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Grid container spacing={2} sx={{ alignItems: "center" }}>
                <Grid size={{ xs: 12, md: 2 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    <Chip
                      icon={<BoxIcon size={14} />}
                      label={`Block #${block.index}`}
                      color={block.index === 0 ? "warning" : "primary"}
                      variant="outlined"
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      {formatDateTime(block.timestamp * 1000)}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ mb: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{ display: "block", color: "text.secondary", fontWeight: "bold" }}
                    >
                      HASH
                    </Typography>
                    <Tooltip title={block.hash}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "monospace",
                          bgcolor: "background.default",
                          p: 0.5,
                          borderRadius: 0.5,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontSize: "0.7rem",
                        }}
                      >
                        {block.hash}
                      </Typography>
                    </Tooltip>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", display: "flex", gap: 1, mt: 0.5, alignItems: "center" }}
                    >
                      <Box component="span" sx={{ fontWeight: "bold" }}>
                        NONCE:
                      </Box>
                      <Box
                        component="span"
                        sx={{ fontFamily: "monospace", bgcolor: "action.hover", px: 0.5, borderRadius: 0.5 }}
                      >
                        {block.nonce}
                      </Box>
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ display: "block", color: "text.secondary", fontWeight: "bold" }}
                    >
                      PREV HASH
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "monospace",
                        fontSize: "0.65rem",
                        color: "text.secondary",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {block.previous_hash}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, fontSize: "0.8rem" }}
                      >
                        <Terminal size={12} /> Action
                      </Typography>
                      <Typography
                        variant="body2"
                        color="secondary.light"
                        sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        {block.mempool?.type === "BATCH_INTERVENTIONS" ? (
                          <span style={{ color: "#facc15" }}>
                            BATCH INTERVENTION ({block.mempool.interventions?.length})
                          </span>
                        ) : (
                          <>
                            {block.mempool?.type?.replace(/_/g, " ") || "GENESIS"}
                            {block.mempool?.target && block.mempool?.target !== "GLOBAL"
                              ? ` -> ${block.mempool.target}`
                              : ""}
                          </>
                        )}
                        {(block.mempool?.change !== undefined ||
                          block.mempool?.starting_troops !== undefined ||
                          block.mempool?.interventions !== undefined ||
                          block.mempool?.data?.new_alliances !== undefined) && (
                          <IconButton
                            size="small"
                            onClick={() => setExpandedBlock(expandedBlock === block.index ? null : block.index)}
                            sx={{ p: 0, ml: 1 }}
                          >
                            {expandedBlock === block.index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </IconButton>
                        )}
                      </Typography>
                    </Box>
                    <Box sx={{ borderLeft: "1px solid", borderColor: "divider", pl: 2, minWidth: 120 }}>
                      <Typography variant="caption" sx={{ fontWeight: "bold", display: "block" }}>
                        WINNER / REWARD
                      </Typography>
                      {block.miner ? (
                        <Typography variant="body2" sx={{ color: "success.main", fontWeight: "bold" }}>
                          {block.miner} (+{formatTroops(block.reward)})
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
                          System Genesis
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Collapse in={expandedBlock === block.index}>
                <Box
                  sx={{
                    mt: 2,
                    p: 1.5,
                    bgcolor: "background.default",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: "bold", color: "primary.main", display: "block", mb: 1 }}
                  >
                    PAYLOAD DETAILS
                  </Typography>
                  <Grid container spacing={2}>
                    {block.mempool?.interventions && (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                          Batched Interventions
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          {block.mempool.interventions.map((item: unknown, idx: number) => (
                            <Box
                              key={idx}
                              sx={{
                                p: 1,
                                bgcolor: "rgba(255,255,255,0.05)",
                                borderRadius: 1,
                                border: "1px solid rgba(255,255,255,0.1)",
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: "bold", color: "warning.light", display: "block" }}
                              >
                                {(item as any).type.replace("_", " ")}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}
                              >
                                <Box component="span" sx={{ fontWeight: "bold" }}>
                                  {(item as any).target}
                                </Box>
                                {(item as any).change !== undefined && (item as any).change !== 0 && (
                                  <Box
                                    component="span"
                                    sx={{
                                      color: (item as any).change > 0 ? "success.light" : "error.light",
                                      fontSize: "0.75rem",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                    }}
                                  >
                                    ⚔️ {(item as any).change > 0 ? "+" : ""}
                                    {formatTroops((item as any).change)}
                                  </Box>
                                )}
                                {(item as any).gold_change !== undefined && (item as any).gold_change !== 0 && (
                                  <Box
                                    component="span"
                                    sx={{
                                      color: "warning.main",
                                      fontSize: "0.75rem",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                    }}
                                  >
                                    💰 {(item as any).gold_change > 0 ? "+" : ""}
                                    {formatGold((item as any).gold_change)}
                                  </Box>
                                )}
                                {(item as any).pop_change !== undefined && (item as any).pop_change !== 0 && (
                                  <Box
                                    component="span"
                                    sx={{
                                      color: "info.main",
                                      fontSize: "0.75rem",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                    }}
                                  >
                                    👥 {(item as any).pop_change > 0 ? "+" : ""}
                                    {(item as any).pop_change}M
                                  </Box>
                                )}
                                {(item as any).starting_troops !== undefined && (
                                  <Box component="span" sx={{ color: "success.light", fontSize: "0.75rem" }}>
                                    ⚔️ {formatTroops((item as any).starting_troops)}
                                  </Box>
                                )}
                                {(item as any).starting_gold !== undefined && (
                                  <Box component="span" sx={{ color: "warning.main", fontSize: "0.75rem" }}>
                                    💰 {formatGold((item as any).starting_gold)}
                                  </Box>
                                )}
                                {(item as any).population !== undefined && (
                                  <Box component="span" sx={{ color: "info.main", fontSize: "0.75rem" }}>
                                    👥 {(item as any).population}M
                                  </Box>
                                )}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Grid>
                    )}
                    {block.mempool?.change !== undefined && block.mempool?.change !== 0 && (
                      <Grid size={{ xs: 4 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Troop Change
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: "bold",
                            color: block.mempool.change > 0 ? "success.main" : "error.main",
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Sword size={14} /> {block.mempool.change > 0 ? "+" : ""}
                          {formatTroops(block.mempool.change)}
                        </Typography>
                      </Grid>
                    )}
                    {block.mempool?.gold_change !== undefined && block.mempool?.gold_change !== 0 && (
                      <Grid size={{ xs: 4 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Gold Change
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: "bold",
                            color: "warning.main",
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Coins size={14} /> {block.mempool.gold_change > 0 ? "+" : ""}
                          {formatGold(block.mempool.gold_change)}
                        </Typography>
                      </Grid>
                    )}
                    {block.mempool?.pop_change !== undefined && block.mempool?.pop_change !== 0 && (
                      <Grid size={{ xs: 4 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Pop Change
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: "bold",
                            color: "info.main",
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Users size={14} /> {block.mempool.pop_change > 0 ? "+" : ""}
                          {block.mempool.pop_change}M
                        </Typography>
                      </Grid>
                    )}
                    {block.mempool?.starting_troops !== undefined && (
                      <Grid size={{ xs: 4 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Initial Troops
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: "bold", color: "success.main" }}>
                          ⚔️ {formatTroops(block.mempool.starting_troops)}
                        </Typography>
                      </Grid>
                    )}
                    {block.mempool?.starting_gold !== undefined && (
                      <Grid size={{ xs: 4 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Initial Gold
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: "bold", color: "warning.main" }}>
                          💰 {formatGold(block.mempool.starting_gold)}
                        </Typography>
                      </Grid>
                    )}
                    {block.mempool?.population !== undefined && (
                      <Grid size={{ xs: 4 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Initial Pop
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: "bold", color: "info.main" }}>
                          👥 {block.mempool.population}M
                        </Typography>
                      </Grid>
                    )}
                    {block.mempool?.data?.economic_deaths &&
                      Object.keys(block.mempool.data.economic_deaths as object).length > 0 && (
                        <Grid size={{ xs: 12 }}>
                          <Box sx={{ mt: 1, p: 1, bgcolor: "rgba(0,0,0,0.1)", borderRadius: 1 }}>
                            <Typography
                              variant="caption"
                              color="error.main"
                              sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}
                            >
                              <Skull size={14} /> Economic Mortality (Treasury Depletion):
                            </Typography>
                            {Object.entries(block.mempool.data.economic_deaths as Record<string, number>).map(
                              ([c, d]) => (
                                <Typography key={c} variant="caption" sx={{ display: "block", color: "error.light" }}>
                                  {c}: -{formatTroops(d)} ⚔️
                                </Typography>
                              ),
                            )}
                          </Box>
                        </Grid>
                      )}
                    {block.mempool?.data?.new_alliances !== undefined && (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                          Alliances Formed
                        </Typography>
                        {block.mempool.data.new_alliances.length > 0 ? (
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                            {block.mempool.data.new_alliances.map((a: string) => (
                              <Typography
                                key={a}
                                variant="body2"
                                sx={{
                                  fontWeight: "bold",
                                  color: "primary.light",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <GitBranch size={14} /> {a.replace(/ <-> /g, " • ")}
                              </Typography>
                            ))}
                            {block.mempool.data.ledger_updates &&
                              Object.keys(block.mempool.data.ledger_updates).length > 0 && (
                                <Box sx={{ mt: 1, p: 1, bgcolor: "rgba(0,0,0,0.1)", borderRadius: 1 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Troop Updates (Fees/Rewards):
                                  </Typography>
                                  {Object.entries(block.mempool.data.ledger_updates).map(([country, amt]) => (
                                    <Typography
                                      key={country}
                                      variant="caption"
                                      sx={{
                                        display: "block",
                                        color: (amt as number) >= 0 ? "success.light" : "error.light",
                                      }}
                                    >
                                      {country}: {(amt as number) > 0 ? "+" : ""}
                                      {formatTroops(amt as number)} ⚔️
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                            {block.mempool.data.gold_ledger_updates &&
                              Object.keys(block.mempool.data.gold_ledger_updates).length > 0 && (
                                <Box sx={{ mt: 1, p: 1, bgcolor: "rgba(0,0,0,0.1)", borderRadius: 1 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Gold Updates (Inc/Exp/God):
                                  </Typography>
                                  {Object.entries(block.mempool.data.gold_ledger_updates).map(([country, amt]) => (
                                    <Typography
                                      key={country}
                                      variant="caption"
                                      sx={{
                                        display: "block",
                                        color: (amt as number) >= 0 ? "warning.light" : "error.light",
                                      }}
                                    >
                                      {country}: {(amt as number) > 0 ? "+" : ""}
                                      {formatGold(amt as number)} 💰
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                            {block.mempool.data.pop_ledger_updates &&
                              Object.keys(block.mempool.data.pop_ledger_updates).length > 0 && (
                                <Box sx={{ mt: 1, p: 1, bgcolor: "rgba(0,0,0,0.1)", borderRadius: 1 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Population Updates:
                                  </Typography>
                                  {Object.entries(block.mempool.data.pop_ledger_updates).map(([country, amt]) => (
                                    <Typography
                                      key={country}
                                      variant="caption"
                                      sx={{
                                        display: "block",
                                        color: (amt as number) >= 0 ? "info.light" : "error.light",
                                      }}
                                    >
                                      {country}: {(amt as number) > 0 ? "+" : ""}
                                      {amt as number}M 👥
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ fontStyle: "italic", color: "text.secondary" }}>
                            None
                          </Typography>
                        )}
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default BlockChainHistory;
