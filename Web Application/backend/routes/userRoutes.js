const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/login', async (req, res) => {
  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email richiesta' });
    }

    let user = await User.findOne({ where: { email } });

    if (!user) {
      user = await User.create({ email });
    }

    res.json({
    email: user.email,
    isAdmin: user.is_admin
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore server' });
  }
});

module.exports = router;