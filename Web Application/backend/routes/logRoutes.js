const express = require('express');
const router = express.Router();
const ApiLog = require('../models/ApiLog');

router.get('/', async (req, res) => {

  try {

    const logs = await ApiLog.findAll({
      limit: 50000,
      order: [['created_at', 'DESC']]
    });

    res.json(logs);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error retrieving logs' });
  }

});

module.exports = router;