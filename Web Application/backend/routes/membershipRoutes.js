const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');

router.get('/', membershipController.getAllMemberships);
router.get('/lobbyist/:lobbyist_id', membershipController.getMembershipsByLobbyist);

module.exports = router;
