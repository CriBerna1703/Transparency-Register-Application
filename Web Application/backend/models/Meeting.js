const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const CommissionRepresentative = require('./CommissionRepresentative');
const MeetingRepresentative = require('./MeetingRepresentative');

const Meeting = sequelize.define('Meeting', {
    lobbyist_id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    meeting_number: {
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    meeting_date: DataTypes.DATE,
    topic: DataTypes.TEXT,
    location: DataTypes.STRING,
}, {
    tableName: 'commission_meetings',
    timestamps: false,
});

MeetingRepresentative.belongsTo(Meeting, {
  foreignKey: 'lobbyist_id',
  targetKey: 'lobbyist_id'
});

MeetingRepresentative.belongsTo(Meeting, {
  foreignKey: 'meeting_number',
  targetKey: 'meeting_number'
});

Meeting.hasMany(MeetingRepresentative, {
  foreignKey: 'lobbyist_id',
  sourceKey: 'lobbyist_id'
});

Meeting.hasMany(MeetingRepresentative, {
  foreignKey: 'meeting_number',
  sourceKey: 'meeting_number'
});

module.exports = Meeting;
