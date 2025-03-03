const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Proposal = sequelize.define('Proposal', {
    proposal_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    proposal_description: DataTypes.TEXT,
}, {
    tableName: 'proposals',
    timestamps: false,
});

module.exports = Proposal;
