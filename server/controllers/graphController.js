const graphService = require('../services/graphService');
const logger = require('../utils/logger');

async function getGraph(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 200;
    const graph = await graphService.buildGraph({ limit });
    res.json(graph);
  } catch (err) {
    logger.error('getGraph error:', err);
    res.status(500).json({ error: 'Failed to build graph', message: err.message });
  }
}

async function getNodeDetails(req, res) {
  try {
    const { type, id } = req.params;
    const details = await graphService.getNodeDetails(type, id);
    if (!details) return res.status(404).json({ error: 'Node not found' });
    res.json(details);
  } catch (err) {
    logger.error('getNodeDetails error:', err);
    res.status(500).json({ error: 'Failed to get node details', message: err.message });
  }
}

async function traceFlow(req, res) {
  try {
    const { billingId } = req.params;
    const trace = await graphService.traceFlow(billingId);
    if (!trace) return res.status(404).json({ error: 'Billing document not found' });
    res.json(trace);
  } catch (err) {
    logger.error('traceFlow error:', err);
    res.status(500).json({ error: 'Failed to trace flow', message: err.message });
  }
}

async function getBrokenFlows(req, res) {
  try {
    const broken = await graphService.findBrokenFlows();
    res.json(broken);
  } catch (err) {
    logger.error('getBrokenFlows error:', err);
    res.status(500).json({ error: 'Failed to find broken flows', message: err.message });
  }
}

module.exports = { getGraph, getNodeDetails, traceFlow, getBrokenFlows };
