const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Membership = sequelize.define('Membership', {
    membership_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    membership_name: DataTypes.TEXT,
}, {
    tableName: 'memberships',
    timestamps: false,
});

module.exports = Membership;
