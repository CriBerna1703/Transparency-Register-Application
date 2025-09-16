const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CommissionCabinet = sequelize.define('CommissionCabinet', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
}, {
    tableName: 'commission_cabinet',    
    timestamps: false,
});

module.exports = CommissionCabinet;
