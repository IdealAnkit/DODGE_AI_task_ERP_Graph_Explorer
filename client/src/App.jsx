import { useState, useCallback, useEffect } from 'react';
import './index.css';
import GraphView from './components/GraphView';
import ChatPanel from './components/ChatPanel';
import NodeDetailModal from './components/NodeDetailModal';
import { useGraph } from './hooks/useGraph';
import { useChat } from './hooks/useChat';

export default function App() {
  const { graph, loading: graphLoading, error: graphError, fetchGraph, fetchNodeDetails } = useGraph();
  const { messages, loading: queryLoading, sendMessage, clearHistory } = useChat();
  const [highlightedNodes, setHighlightedNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => { fetchGraph(200); }, [fetchGraph]);

  // Set highlights — no auto-clear timer; user clears manually
  const handleHighlight = useCallback((nodeIds) => {
    setHighlightedNodes(nodeIds);
  }, []);

  // Manual clear via the "✕ Clear highlights" button
  const handleClearHighlights = useCallback(() => {
    setHighlightedNodes([]);
  }, []);

  const handleNodeClick = useCallback(async (nodeData) => {
    setSelectedNode(nodeData);
    setDetailData(null);
    setDetailLoading(true);
    try {
      const details = await fetchNodeDetails(nodeData.nodeType, nodeData.id);
      setDetailData(details);
    } catch {
      setDetailData(nodeData);
    } finally {
      setDetailLoading(false);
    }
  }, [fetchNodeDetails]);

  const handleSend = useCallback((query) => {
    sendMessage(query, handleHighlight);
  }, [sendMessage, handleHighlight]);

  const modalNode = detailData
    ? { ...detailData, type: selectedNode?.nodeType, label: selectedNode?.label }
    : selectedNode
    ? { ...selectedNode, type: selectedNode.nodeType }
    : null;

  return (
    <div className="app-layout">
      <div className="graph-panel">
        <GraphView
          graph={graph}
          loading={graphLoading}
          error={graphError}
          onRetry={() => fetchGraph(200)}
          onNodeClick={handleNodeClick}
          highlightedNodes={highlightedNodes}
          onClearHighlights={handleClearHighlights}
          theme={theme}
          toggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        />
      </div>

      <div className="chat-panel">
        <ChatPanel
          messages={messages}
          loading={queryLoading}
          onSend={handleSend}
          onClearHistory={clearHistory}
          historyLength={Math.floor(messages.filter(m => m.role === 'user').length)}
        />
      </div>

      {selectedNode && (
        <NodeDetailModal
          node={modalNode}
          loading={detailLoading}
          onClose={() => { setSelectedNode(null); setDetailData(null); }}
        />
      )}
    </div>
  );
}
