const express = require('express');
const router = express.Router();
const cabinetController = require('../controllers/cabinetController');

router.get('/:id', cabinetController.getCabinetById);

module.exports = router;
