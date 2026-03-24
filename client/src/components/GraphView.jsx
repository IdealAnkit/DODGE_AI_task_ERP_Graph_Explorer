import React, { memo, useMemo, useEffect, useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  MiniMap,
  Handle,
  Position,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

// ── Node configs ─────────────────────────────────────────────────────────────
const NODE_CONFIG = {
  SalesOrder:      { icon: '📋', color: '#1f6feb', label: 'Sales Order' },
  Delivery:        { icon: '🚚', color: '#238636', label: 'Delivery' },
  BillingDocument: { icon: '🧾', color: '#9e6a03', label: 'Billing' },
  JournalEntry:    { icon: '📒', color: '#6e40c9', label: 'Journal' },
  Payment:         { icon: '💳', color: '#bf4b8a', label: 'Payment' },
  Customer:        { icon: '👤', color: '#0e9aa7', label: 'Customer' },
  Product:         { icon: '📦', color: '#5a6a82', label: 'Product' },
};

// ── Custom ERP Node ───────────────────────────────────────────────────────────
const ERPNode = memo(({ data }) => {
  const cfg = NODE_CONFIG[data.nodeType] || { icon: '⬡', color: '#666', label: data.nodeType };

  let style = {};
  if (data.dimmed)         style = { opacity: 0.12, filter: 'grayscale(0.8)', transition: 'opacity 0.2s' };
  if (data.highlighted)    style = { boxShadow: '0 0 0 3px #ffd700, 0 0 18px rgba(255,215,0,0.35)', transition: 'box-shadow 0.2s' };
  if (data.neighborFocused) style = { boxShadow: `0 0 0 2.5px ${cfg.color}, 0 0 12px ${cfg.color}55`, transition: 'box-shadow 0.2s' };
  if (data.selfFocused)    style = { boxShadow: '0 0 0 3px #fff, 0 0 16px rgba(255,255,255,0.3)', transition: 'box-shadow 0.2s' };

  return (
    <div className={`erp-node type-${data.nodeType}`} style={style}
      onClick={() => data.onNodeClick?.(data)}>
      <Handle type="target" position={Position.Left}
        style={{ background: cfg.color, border: 'none', width: 7, height: 7 }} />
      <div className="erp-node-header">
        <span className="erp-node-icon">{cfg.icon}</span>
        <span className="erp-node-type" style={{ color: cfg.color }}>{cfg.label}</span>
      </div>
      <div className="erp-node-label">{data.label}</div>
      <Handle type="source" position={Position.Right}
        style={{ background: cfg.color, border: 'none', width: 7, height: 7 }} />
    </div>
  );
});
ERPNode.displayName = 'ERPNode';

// MUST be outside any component
const nodeTypes = { erpNode: ERPNode };

const EDGE_COLORS = {
  so_customer:      '#0e9aa7',
  so_delivery:      '#238636',
  delivery_billing: '#9e6a03',
  billing_journal:  '#6e40c9',
  customer_payment: '#bf4b8a',
};

// ── Column-based layout (original good layout) ────────────────────────────────
const TYPE_ORDER = ['Customer', 'SalesOrder', 'Delivery', 'BillingDocument', 'JournalEntry', 'Payment', 'Product'];
const COL_WIDTH  = 300;
const ROW_HEIGHT = 100;

function layoutNodes(rawNodes) {
  const columns = {};
  for (const n of rawNodes) {
    const col = TYPE_ORDER.indexOf(n.type);
    const c = col === -1 ? 7 : col;
    if (!columns[c]) columns[c] = [];
    columns[c].push(n);
  }
  const out = [];
  for (const [col, nodes] of Object.entries(columns)) {
    nodes.forEach((node, row) => {
      out.push({
        id: node.id,
        type: 'erpNode',
        data: { label: node.label, nodeType: node.type, ...node.data },
        position: { x: parseInt(col) * COL_WIDTH + 60, y: row * ROW_HEIGHT + 60 },
      });
    });
  }
  return out;
}

function buildEdges(rawEdges, nodeSet) {
  return rawEdges
    .filter(e => nodeSet.has(e.source) && nodeSet.has(e.target))
    .slice(0, 600)
    .map(e => ({ id: e.id, source: e.source, target: e.target, _type: e.type }));
}

// ── Inner controls (zoom slider + arrow pad) ──────────────────────────────────
const PAN_STEP = 140;

function GraphInnerControls({ highlightedNodes, onClearHighlights, focusedNodeId, onClearFocus }) {
  const { zoomIn, zoomOut, getZoom, setZoom, getViewport, setViewport, fitView } = useReactFlow();
  const [zoom, setZoomDisplay] = useState(1);

  useEffect(() => {
    const id = setInterval(() => setZoomDisplay(Math.round(getZoom() * 100) / 100), 250);
    return () => clearInterval(id);
  }, [getZoom]);

  // Auto-pan to LLM-highlighted nodes
  useEffect(() => {
    if (!highlightedNodes.length) return;
    const t = setTimeout(() =>
      fitView({ nodes: highlightedNodes.map(id => ({ id })), duration: 700, padding: 0.3, maxZoom: 2 }), 150);
    return () => clearTimeout(t);
  }, [highlightedNodes, fitView]);

  const pan = useCallback((dx, dy) => {
    const vp = getViewport();
    setViewport({ ...vp, x: vp.x + dx, y: vp.y + dy }, { duration: 150 });
  }, [getViewport, setViewport]);

  return (
    <div className="graph-inner-controls">
      <div className="zoom-controls">
        <button className="ctrl-btn" onClick={() => zoomOut({ duration: 200 })} title="Zoom Out">－</button>
        <input type="range" min="0.05" max="4" step="0.05" value={zoom}
          onInput={e => { const v = parseFloat(e.target.value); setZoom(v); setZoomDisplay(v); }}
          onChange={e => { const v = parseFloat(e.target.value); setZoom(v); setZoomDisplay(v); }}
          className="zoom-slider" />
        <button className="ctrl-btn" onClick={() => zoomIn({ duration: 200 })} title="Zoom In">＋</button>
        <span className="zoom-label">{Math.round(zoom * 100)}%</span>
        <button className="ctrl-btn fit-btn" onClick={() => fitView({ duration: 500, padding: 0.1 })} title="Fit all">⛶</button>
      </div>

      <div className="arrow-pad">
        <button className="arrow-btn" onClick={() => pan(0, PAN_STEP)}>▲</button>
        <div className="arrow-row">
          <button className="arrow-btn" onClick={() => pan(PAN_STEP, 0)}>◀</button>
          <button className="arrow-btn center-btn" onClick={() => fitView({ duration: 400, padding: 0.1 })}>⊙</button>
          <button className="arrow-btn" onClick={() => pan(-PAN_STEP, 0)}>▶</button>
        </div>
        <button className="arrow-btn" onClick={() => pan(0, -PAN_STEP)}>▼</button>
      </div>

      {(highlightedNodes.length > 0 || focusedNodeId) && (
        <div className="highlight-actions">
          {focusedNodeId && (
            <button className="clear-highlight-btn" onClick={onClearFocus}>✕ Clear focus</button>
          )}
          {highlightedNodes.length > 0 && (
            <button className="clear-highlight-btn" onClick={onClearHighlights}>
              ✕ Clear {highlightedNodes.length} highlight{highlightedNodes.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Graph Canvas ──────────────────────────────────────────────────────────────
function GraphCanvas({ rawNodes, rawEdges, onNodeClick, highlightedNodes, onClearHighlights }) {
  const [focusedNodeId, setFocusedNodeId] = useState(null);

  const baseNodes = useMemo(() => layoutNodes(rawNodes), [rawNodes]);

  const baseEdges = useMemo(() => {
    const nodeSet = new Set(rawNodes.map(n => n.id));
    return buildEdges(rawEdges, nodeSet);
  }, [rawNodes, rawEdges]);

  // Compute neighbors of focused node
  const { connectedNodeIds, connectedEdgeIds } = useMemo(() => {
    if (!focusedNodeId) return { connectedNodeIds: null, connectedEdgeIds: null };
    const nodeIds = new Set([focusedNodeId]);
    const edgeIds = new Set();
    for (const e of baseEdges) {
      if (e.source === focusedNodeId || e.target === focusedNodeId) {
        nodeIds.add(e.source);
        nodeIds.add(e.target);
        edgeIds.add(e.id);
      }
    }
    return { connectedNodeIds: nodeIds, connectedEdgeIds: edgeIds };
  }, [focusedNodeId, baseEdges]);

  const rfNodes = useMemo(() => baseNodes.map(n => ({
    ...n,
    data: {
      ...n.data,
      highlighted:     highlightedNodes.includes(n.id),
      selfFocused:     focusedNodeId === n.id,
      neighborFocused: connectedNodeIds ? connectedNodeIds.has(n.id) && focusedNodeId !== n.id : false,
      dimmed:          connectedNodeIds ? !connectedNodeIds.has(n.id) : false,
      onNodeClick: (data) => {
        setFocusedNodeId(prev => prev === n.id ? null : n.id);
        onNodeClick({ ...data, rfNodeId: n.id });
      },
    },
  })), [baseNodes, highlightedNodes, focusedNodeId, connectedNodeIds, onNodeClick]);

  const rfEdges = useMemo(() => baseEdges.map(e => {
    const color = EDGE_COLORS[e._type] || '#444';
    const isConn = connectedEdgeIds ? connectedEdgeIds.has(e.id) : true;
    const opacity = connectedEdgeIds ? (isConn ? 1 : 0.07) : 0.65;
    const sw      = isConn && connectedEdgeIds ? 2.5 : 1.5;
    return {
      ...e,
      type: 'bezier',
      style: { stroke: color, strokeWidth: sw, opacity },
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 9, height: 9 },
      animated: isConn && !!connectedEdgeIds,
    };
  }), [baseEdges, connectedEdgeIds]);

  return (
    <ReactFlow
      nodes={rfNodes}
      edges={rfEdges}
      nodeTypes={nodeTypes}
      defaultViewport={{ x: 60, y: 60, zoom: 0.5 }}
      minZoom={0.03}
      maxZoom={4}
      proOptions={{ hideAttribution: true }}
      zoomOnScroll
      panOnDrag
      onPaneClick={() => setFocusedNodeId(null)}
    >
      <Background color="#1a1f27" gap={24} size={1} />
      <MiniMap
        nodeColor={n => NODE_CONFIG[n.data?.nodeType]?.color || '#555'}
        nodeStrokeWidth={2}
        pannable zoomable
        maskColor="rgba(10,13,18,0.75)"
        style={{ width: 160, height: 100 }}
      />
      <GraphInnerControls
        highlightedNodes={highlightedNodes}
        onClearHighlights={onClearHighlights}
        focusedNodeId={focusedNodeId}
        onClearFocus={() => setFocusedNodeId(null)}
      />
    </ReactFlow>
  );
}

// ── Overlay (header + legend) ─────────────────────────────────────────────────
function GraphOverlay({ graph, highlightedNodes }) {
  const typeCounts = useMemo(() =>
    (graph.nodes || []).reduce((a, n) => { a[n.type] = (a[n.type] || 0) + 1; return a; }, {}),
    [graph.nodes]
  );
  return (
    <>
      <div className="app-header">
        <div>
          <div className="app-title">ERP Graph Explorer</div>
          <div className="app-subtitle">SAP Order-to-Cash Dataset</div>
        </div>
        <div className="app-badge">⬡ React Flow</div>
        <div className="app-badge" style={{ borderColor: 'rgba(63,185,80,0.4)', color: '#3fb950' }}>✦ Gemini AI</div>
      </div>
      <div className="graph-controls">
        <div className="graph-stats">
          <span><strong>{(graph.nodes||[]).length}</strong> nodes</span>
          <span><strong>{(graph.edges||[]).length}</strong> edges</span>
          {highlightedNodes.length > 0 && <span style={{ color:'#ffd700' }}>✦ <strong>{highlightedNodes.length}</strong> lit</span>}
        </div>
        <div className="graph-legend">
          <div className="legend-title">Node Types</div>
          {Object.entries(NODE_CONFIG).map(([type, cfg]) => (
            <div className="legend-item" key={type}>
              <div className="legend-dot" style={{ background: cfg.color }} />
              {cfg.label}
              {typeCounts[type] ? <span style={{ color:'var(--text-muted)', fontSize:'11px' }}>({typeCounts[type]})</span> : null}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function GraphView({ graph, loading, error, onRetry, onNodeClick, highlightedNodes, onClearHighlights }) {
  if (loading) return (
    <div className="graph-loading">
      <div className="spinner" />
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading ERP graph...</p>
    </div>
  );
  if (error) return (
    <div className="graph-error">
      <p>⚠️ {error}</p>
      <button className="btn-retry" onClick={onRetry}>Retry</button>
    </div>
  );

  return (
    <>
      <GraphOverlay graph={graph} highlightedNodes={highlightedNodes} />
      <div style={{ position: 'absolute', inset: 0 }}>
        <ReactFlowProvider>
          <GraphCanvas
            rawNodes={graph.nodes || []}
            rawEdges={graph.edges || []}
            onNodeClick={onNodeClick}
            highlightedNodes={highlightedNodes}
            onClearHighlights={onClearHighlights}
          />
        </ReactFlowProvider>
      </div>
    </>
  );
}
