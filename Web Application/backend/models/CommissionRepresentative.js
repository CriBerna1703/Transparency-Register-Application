const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const CommissionCabinet = require('./CommissionCabinet');
const MeetingRepresentative = require('./MeetingRepresentative');

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

CommissionRepresentative.hasMany(MeetingRepresentative, {
    foreignKey: 'representative_id'
});

MeetingRepresentative.belongsTo(CommissionRepresentative, {
    foreignKey: 'representative_id'
});

module.exports = CommissionRepresentative;
