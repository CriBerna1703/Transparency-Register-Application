const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const CommissionRepresentative = require('./CommissionRepresentative');
const Directorate = require('./Directorate');

const RepresentativeAllocation = sequelize.define('RepresentativeAllocation', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    representative_id: DataTypes.INTEGER,
    directorate_id: DataTypes.INTEGER,
    year: DataTypes.INTEGER,
    role: DataTypes.STRING,
}, {
    tableName: 'representative_allocation',
    timestamps: false,
});

RepresentativeAllocation.belongsTo(CommissionRepresentative, { foreignKey: 'representative_id' });
RepresentativeAllocation.belongsTo(Directorate, { foreignKey: 'directorate_id' });
CommissionRepresentative.hasMany(RepresentativeAllocation, { foreignKey: 'representative_id' });
Directorate.hasMany(RepresentativeAllocation, { foreignKey: 'directorate_id' });

module.exports = RepresentativeAllocation;
