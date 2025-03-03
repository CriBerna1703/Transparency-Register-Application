const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const CommissionRepresentative = require('./CommissionRepresentative');

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
    representative_id: DataTypes.INTEGER,
    location: DataTypes.STRING,
}, {
    tableName: 'commission_meetings',
    timestamps: false,
});

Meeting.belongsTo(CommissionRepresentative, { foreignKey: 'representative_id' });
CommissionRepresentative.hasMany(Meeting, { foreignKey: 'representative_id' });

module.exports = Meeting;
