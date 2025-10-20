const express = require('express');
const router = express.Router();
const lobbyistController = require('../controllers/lobbyistController');

router.get('/', lobbyistController.getLobbyistsDetails);

module.exports = router;
