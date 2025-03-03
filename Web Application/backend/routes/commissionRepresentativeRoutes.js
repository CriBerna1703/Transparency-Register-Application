const express = require('express');
const router = express.Router();
const commissionRepresentativeController = require('../controllers/commissionRepresentativeController');

// Rotte per i rappresentanti della Commissione
router.get('/', commissionRepresentativeController.getAllRepresentatives);
router.get('/:id', commissionRepresentativeController.getRepresentativeById);

module.exports = router;
