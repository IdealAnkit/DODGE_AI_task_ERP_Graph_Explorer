const express = require('express');
const router = express.Router();
const graphController = require('../controllers/graphController');

// GET /graph - Returns full graph data (nodes + edges)
router.get('/', graphController.getGraph);

// GET /graph/node/:type/:id - Get detailed data for a specific node
router.get('/node/:type/:id', graphController.getNodeDetails);

// GET /graph/trace/:billingId - Trace O2C flow from a billing document
router.get('/trace/:billingId', graphController.traceFlow);

// GET /graph/broken - Find broken/incomplete O2C flows  
router.get('/broken', graphController.getBrokenFlows);

module.exports = router;
