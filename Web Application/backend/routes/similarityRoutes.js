const express = require('express');
const router = express.Router();
const similarityController = require('../controllers/similarityController');

router.post('/', similarityController.computeSimilarities);

module.exports = router;
