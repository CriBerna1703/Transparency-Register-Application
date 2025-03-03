const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Field = sequelize.define('Field', {
    field_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    field_name: DataTypes.STRING,
}, {
    tableName: 'fields_of_interest',
    timestamps: false,
});

module.exports = Field;
