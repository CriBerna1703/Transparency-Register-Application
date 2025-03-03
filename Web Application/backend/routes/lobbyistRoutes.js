const express = require('express');
const router = express.Router();
const lobbyistController = require('../controllers/lobbyistController');

router.get('/', lobbyistController.getAllLobbyists);
router.get('/:lobbyist_id', lobbyistController.getLobbyistById);
router.get('/:lobbyist_id/details', lobbyistController.getLobbyistDetails);

module.exports = router;
