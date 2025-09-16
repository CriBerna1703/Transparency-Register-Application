const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Meeting = require('./Meeting');
const CommissionRepresentative = require('./CommissionRepresentative');
const CommissionCabinet = require('./CommissionCabinet');

const MeetingRepresentative = sequelize.define('MeetingRepresentative', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    lobbyist_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    meeting_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    representative_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    cabinet_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
}, {
    tableName: 'meeting_representatives',
    timestamps: false,
});

MeetingRepresentative.belongsTo(CommissionCabinet, {
    foreignKey: 'cabinet_id'
});

CommissionCabinet.hasMany(MeetingRepresentative, {
    foreignKey: 'cabinet_id'
});

module.exports = MeetingRepresentative;
