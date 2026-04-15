"use client"

import { useEffect, useState, useRef } from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { Box, Typography } from '@mui/material';
import ForceGraph2D from 'react-force-graph-2d';
import { GraphNode, GraphLink } from '@/types/graph';

export default function NetworkMap() {
  const { ledger, alliances } = useSimulationStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[], links: GraphLink[] }>({ nodes: [], links: [] });
  
  type GraphInstance = React.ElementRef<typeof ForceGraph2D> & {
    zoomToFit?: (duration?: number, padding?: number) => void;
    zoom?: (val?: number, duration?: number) => void;
  };
  const graphRef = useRef<GraphInstance>(null);
  const initialZoomRef = useRef(false);

  const nodeCache = useRef(new Map<string, GraphNode>());
  const linkCache = useRef(new Map<string, GraphLink>());

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDimensions(prev => {
          // ResizeLoop (titreme/geri sekme) olmasını önlemek için 2px tolerans payı bırakıyoruz
          if (Math.abs(prev.width - entry.contentRect.width) > 2 || Math.abs(prev.height - entry.contentRect.height) > 2) {
            return { width: entry.contentRect.width, height: entry.contentRect.height };
          }
          return prev;
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    
    // Initial size
    setDimensions({
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight
    });

    return () => resizeObserver.disconnect();
  }, []);

  const lastHashRef = useRef<string>("");

  useEffect(() => {
    // Sadece gerçekten değer değişirse setState ve Reheat işlemi yap
    const currentHash = JSON.stringify(ledger) + JSON.stringify(alliances);
    if (lastHashRef.current === currentHash) return;
    lastHashRef.current = currentHash;

    // Mevcut node (düğüm) objelerini koruduğumuzda, D3.js'in x/y/vx/vy fizik lokasyonları sıfırlanmaz.
    const nodes = Object.keys(ledger).map(country => {
      const val = Math.max(2, Math.sqrt(ledger[country] || 1000) / 10);
      
      let nodeInstance = nodeCache.current.get(country);
      if (nodeInstance) {
        nodeInstance.val = val; // Sadece büyüklüğü güncelle
        nodeInstance.name = country;
      } else {
        // Yeni yaratıldıysa cache'e al
        nodeInstance = { id: country, name: country, val };
        nodeCache.current.set(country, nodeInstance);
      }
      return nodeInstance;
    });

    const links = alliances.map(allianceStr => {
      const parts = allianceStr.split(" <-> ");
      if (parts.length === 2) {
        const linkId = `${parts[0]}-${parts[1]}`;
        let linkInstance = linkCache.current.get(linkId);
        if (!linkInstance) {
          linkInstance = { id: linkId, source: parts[0], target: parts[1] };
          linkCache.current.set(linkId, linkInstance);
        }
        return linkInstance;
      }
      return null;
    }).filter(Boolean) as GraphLink[];

    setGraphData({ nodes, links });
  }, [ledger, alliances]);

  return (
    <Box ref={containerRef} sx={{ width: '100%', height: '100%', minHeight: 400, position: 'relative', bgcolor: '#1e1e1e', borderRadius: 2, overflow: 'hidden' }}>
      {typeof window !== 'undefined' && graphData.nodes.length > 0 ? (
        <ForceGraph2D
          ref={graphRef as React.LegacyRef<ForceGraph2D>}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeAutoColorBy="id"
          nodeRelSize={6}
          minZoom={1.5} // Ekranın çok fazla geriye (küçülmesine) izin verme
          maxZoom={10}
          d3AlphaDecay={0.01} // Simülasyonun çok hızlı sönmesini engeller (daha organik süzülüş)
          d3VelocityDecay={0.4} // Düğümlerin enerjisinin emilmesi (friction)
          d3AlphaMin={0.05} // Simülasyonun uyanık kalmasını sağlar, böylece düğümler aniden durup geri sekmez
          onEngineStop={() => {
            // Yalnızca ilk yüklendiğinde bir kez ortala, sonrasında kullanıcının gezinmesini (pan/zoom) bozma!
            if (graphRef.current?.zoomToFit && !initialZoomRef.current) {
              // Eğer çok dışarıdaysa biraz daha sıkı sığdır (30px padding ile)
              graphRef.current.zoomToFit(600, 30); 
              initialZoomRef.current = true;
            }
          }}
          linkColor={() => 'rgba(255, 255, 255, 0.4)'}
          linkWidth={2}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const graphNode = node as GraphNode;
            const label = graphNode.name;
            const fontSize = 12 / globalScale;
            ctx.font = `${Math.max(fontSize, 4)}px Sans-Serif`;
            
            // Base circle
            ctx.fillStyle = graphNode.color || '#3b82f6';
            ctx.beginPath();
            ctx.arc(graphNode.x || 0, graphNode.y || 0, graphNode.val * 2, 0, 2 * Math.PI, false);
            ctx.fill();

            // Label
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            // Offset text slightly below the node if it's large, otherwise center
            ctx.fillText(label, graphNode.x || 0, (graphNode.y || 0) + (graphNode.val * 2) + fontSize);
            
            // Sub-label for troops
            const troopScore = ledger[graphNode.id] || 0;
            ctx.font = `${Math.max(fontSize * 0.8, 3)}px Sans-Serif`;
            ctx.fillStyle = '#aaa';
            ctx.fillText(troopScore.toLocaleString(), graphNode.x || 0, (graphNode.y || 0) + (graphNode.val * 2) + fontSize * 2.2);
          }}
        />
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
          <Typography>Waiting for simulation data...</Typography>
        </Box>
      )}
    </Box>
  );
}