const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Directorate = sequelize.define('Directorate', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
}, {
    tableName: 'directorate',
    timestamps: false,
});

module.exports = Directorate;
