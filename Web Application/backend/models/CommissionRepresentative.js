const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CommissionRepresentative = sequelize.define('CommissionRepresentative', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    name: DataTypes.STRING,
}, {
    tableName: 'commission_representative',
    timestamps: false,
});

module.exports = CommissionRepresentative;
