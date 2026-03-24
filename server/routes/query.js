const express = require('express');
const router = express.Router();
const { handleQuery, handleQueryStream } = require('../controllers/queryController');

// POST /query       — standard JSON response (for compatibility)
router.post('/', handleQuery);

// POST /query/stream — Server-Sent Events streaming (typed tokens as they arrive)
router.post('/stream', handleQueryStream);

module.exports = router;
