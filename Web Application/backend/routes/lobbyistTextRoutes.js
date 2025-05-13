const express = require('express');
const router = express.Router();
const lobbyistTextController = require('../controllers/lobbyistTextController');

// GET /api/lobbyist/:id/text
router.get('/:id/text', lobbyistTextController.getLobbyistText);

module.exports = router;
