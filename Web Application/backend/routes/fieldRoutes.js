const express = require('express');
const router = express.Router();
const fieldController = require('../controllers/fieldController');

router.get('/', fieldController.getAllFields);
router.get('/lobbyist/:lobbyist_id', fieldController.getFieldsByLobbyist);

module.exports = router;
