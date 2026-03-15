const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ApiLog = sequelize.define('ApiLog', {

  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },

  user_email: {
    type: DataTypes.STRING
  },

  method: {
    type: DataTypes.STRING
  },

  endpoint: {
    type: DataTypes.STRING
  },

  query_params: {
    type: DataTypes.TEXT
  },

  body: {
    type: DataTypes.JSON
  }

}, {
  tableName: 'api_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = ApiLog;