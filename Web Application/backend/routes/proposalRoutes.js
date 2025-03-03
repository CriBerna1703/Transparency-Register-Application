const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/proposalController');

router.get('/', proposalController.getAllProposals);
router.get('/lobbyist/:lobbyist_id', proposalController.getProposalsByLobbyist);

module.exports = router;
