const express = require('express');
const router = express.Router();
const similarityController = require('../controllers/similarityTextController');

router.post('/', similarityController.computeTextSimilarities);

module.exports = router;

