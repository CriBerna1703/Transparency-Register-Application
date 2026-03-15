const ApiLog = require('../models/ApiLog');

const apiLogger = async (req, res, next) => {

  try {
    const endpoint = req.originalUrl;

    if (endpoint.startsWith('/api/fields/lobbyist')) {
      return next();
    }

    const email = req.headers['x-user-email'] || null;

    await ApiLog.create({
      user_email: email,
      method: req.method,
      endpoint: endpoint,
      query_params: JSON.stringify(req.query),
      body: req.body
    });

  } catch (err) {
    console.error("Logging error:", err);
  }

  next();
};

module.exports = apiLogger;