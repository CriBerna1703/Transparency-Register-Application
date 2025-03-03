const express = require('express');
const router = express.Router();
const directorateController = require('../controllers/directorateController');

router.get('/', directorateController.getAllDirectorates);
router.get('/:id', directorateController.getDirectorateById);

module.exports = router;
