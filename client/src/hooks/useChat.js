import { useState, useCallback, useRef } from 'react';

let msgIdCounter = 1;
const newId = () => `msg_${msgIdCounter++}`;

export function useChat() {
  const [messages, setMessages]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const historyRef = useRef([]); // conversation history for memory

  const sendMessage = useCallback(async (userQuery, onHighlight) => {
    if (!userQuery.trim() || loading) return;

    // Add user message immediately
    const userMsg = { id: newId(), role: 'user', content: userQuery };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Placeholder assistant message that we'll update as chunks arrive
    const assistantId = newId();
    const assistantMsg = {
      id: assistantId,
      role: 'assistant',
      content: '',
      sql: null,
      data: null,
      rowCount: null,
      highlightedNodes: [],
      type: 'streaming',
    };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      // Hit the SSE streaming endpoint
      const response = await fetch('/query/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userQuery,
          history: historyRef.current,
        }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = '';
      let   fullText = '';

      // Parse SSE stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line in buffer

        let event = null;
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            event = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (event === 'chunk') {
              fullText += data.text;
              // Update message content incrementally
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: fullText } : m
              ));
            } else if (event === 'done') {
              // Finalize message with all metadata
              setMessages(prev => prev.map(m =>
                m.id === assistantId
                  ? {
                      ...m,
                      content: fullText,
                      type: data.type,
                      intent: data.intent,
                      sql: data.sql,
                      data: data.data,
                      rowCount: data.rowCount,
                      highlightedNodes: data.highlightedNodes || [],
                    }
                  : m
              ));
              // Trigger graph highlights
              if (onHighlight && data.highlightedNodes?.length > 0) {
                onHighlight(data.highlightedNodes);
              }
            } else if (event === 'error') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: data.message || 'An error occurred.', type: 'error' }
                  : m
              ));
            }
            event = null;
          }
        }
      }

      // Update conversation history for memory (keep last 8 turns)
      historyRef.current = [
        ...historyRef.current,
        { role: 'user',      content: userQuery,  sql: null },
        { role: 'assistant', content: fullText,    sql: null },
      ].slice(-8);

    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: `Error: ${err.message}`, type: 'error' }
          : m
      ));
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    setMessages([]);
  }, []);

  return { messages, loading, sendMessage, clearHistory };
}
