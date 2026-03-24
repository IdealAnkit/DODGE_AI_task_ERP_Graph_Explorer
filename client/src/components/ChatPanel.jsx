import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

const SUGGESTIONS = [
  'How many sales orders exist in total?',
  'Which customers have the most billing documents?',
  'Find sales orders that were delivered but not billed',
  'What is the total revenue from billing documents?',
  'List the top 5 products by billing quantity',
];

function SqlBlock({ sql }) {
  const [open, setOpen] = useState(false);
  if (!sql) return null;
  return (
    <div className="sql-block">
      <div className="sql-block-header" onClick={() => setOpen(o => !o)}>
        <span className="sql-block-label">🔎 Generated SQL</span>
        <span className="sql-block-toggle">{open ? '▲ Hide' : '▼ Show'}</span>
      </div>
      {open && <pre className="sql-code">{sql}</pre>}
    </div>
  );
}

function DataTable({ data }) {
  if (!data || data.length === 0) return null;
  const cols = Object.keys(data[0]);
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>{cols.map(c => <th key={c}>{c.replace(/_/g, ' ')}</th>)}</tr>
        </thead>
        <tbody>
          {data.slice(0, 10).map((row, i) => (
            <tr key={i}>
              {cols.map(c => (
                <td key={c}>{row[c] == null ? '—' : String(row[c])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 10 && (
        <div className="data-more">+{data.length - 10} more rows</div>
      )}
    </div>
  );
}

function Message({ msg }) {
  const [showTable, setShowTable] = useState(false);

  if (msg.role === 'user') {
    return (
      <div className="message message-user">
        <div className="message-bubble">{msg.content}</div>
      </div>
    );
  }

  const isStreaming = msg.type === 'streaming';
  const bubbleClass = `message-bubble${
    msg.type === 'rejected' ? ' rejected' : msg.type === 'error' ? ' error' : ''
  }`;

  return (
    <div className="message message-assistant">
      <div className={bubbleClass}>
        <div className="markdown-body">
          <ReactMarkdown>{msg.content || ' '}</ReactMarkdown>
          {isStreaming && <span className="stream-cursor">▌</span>}
        </div>

        <SqlBlock sql={msg.sql} />

        {/* Row count + optional table toggle */}
        {msg.rowCount !== undefined && msg.rowCount !== null && (
          <div className="data-meta">
            <span className="data-count">📊 {msg.rowCount} row{msg.rowCount !== 1 ? 's' : ''} returned</span>
            {msg.data && msg.data.length > 0 && (
              <button className="table-toggle-btn" onClick={() => setShowTable(s => !s)}>
                {showTable ? '▲ Hide table' : '▼ View table'}
              </button>
            )}
          </div>
        )}

        {showTable && <DataTable data={msg.data} />}

        {msg.highlightedNodes && msg.highlightedNodes.length > 0 && (
          <div className="highlight-info">
            ✦ {msg.highlightedNodes.length} node{msg.highlightedNodes.length !== 1 ? 's' : ''} highlighted on graph
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="message message-loading">
      <div className="message-bubble">
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Thinking...</span>
        <div className="typing-dots">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

export default function ChatPanel({ messages, loading, onSend, onClearHistory, historyLength }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    onSend(trimmed);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div className="chat-header">
        <div className="chat-header-icon">🤖</div>
        <div style={{ flex: 1 }}>
          <div className="chat-title">ERP Assistant</div>
          <div className="chat-subtitle">
            Powered by Gemini AI
            {historyLength > 0 && <span className="memory-badge">💬 {historyLength} turns remembered</span>}
          </div>
        </div>
        {messages.length > 0 && (
          <button className="clear-chat-btn" onClick={onClearHistory} title="Clear conversation">
            🗑 Clear
          </button>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-welcome">
            <h3>Ask about your ERP data</h3>
            <p>Query sales orders, deliveries, billing, customers, and more using natural language.</p>
            <div className="suggestions">
              {SUGGESTIONS.map(s => (
                <button key={s} className="suggestion-chip" onClick={() => !loading && onSend(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => <Message key={msg.id} msg={msg} />)}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="chat-input-area">
        <div className="chat-input-form">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Ask about ERP data..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            title="Send (Enter)"
          >
            ↑
          </button>
        </div>
        <div className="chat-footer">All answers are grounded in the ERP dataset • Enter to send</div>
      </div>
    </>
  );
}
