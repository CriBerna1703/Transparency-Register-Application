const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {

  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },

  is_admin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }

}, {
  tableName: 'users',
  timestamps: false
});

module.exports = User;