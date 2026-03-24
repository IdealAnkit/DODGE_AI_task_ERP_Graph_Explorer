const { processQuery, processQueryStream } = require('../services/llmService');
const logger = require('../utils/logger');

// ── Regular (non-streaming) endpoint — kept for compatibility ─────────────
async function handleQuery(req, res) {
  try {
    const { query, history = [] } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Query is required' });
    }
    if (query.length > 1000) {
      return res.status(400).json({ error: 'Query too long (max 1000 characters)' });
    }
    const result = await processQuery(query.trim(), history);
    res.json(result);
  } catch (err) {
    logger.error('Query controller error:', err);
    res.status(500).json({ error: 'Query processing failed', message: err.message });
  }
}

// ── Streaming endpoint via Server-Sent Events ─────────────────────────────
// Client connects, receives 'chunk' events, then a final 'done' event.
async function handleQueryStream(req, res) {
  const { query, history = [] } = req.body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Query is required' });
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Send a "thinking" event immediately so UI knows request was received
    send('thinking', { message: 'Processing your query...' });

    const result = await processQueryStream(query.trim(), history, (chunk) => {
      send('chunk', { text: chunk });
    });

    // Send final metadata (sql, data, highlighted nodes, etc.)
    send('done', {
      type: result.type,
      intent: result.intent,
      sql: result.sql,
      data: result.data,
      rowCount: result.rowCount,
      highlightedNodes: result.highlightedNodes,
    });

    res.end();
  } catch (err) {
    logger.error('Stream query error:', err);
    send('error', { message: err.message });
    res.end();
  }
}

module.exports = { handleQuery, handleQueryStream };
