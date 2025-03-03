const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Field = require('./Field');
const Membership = require('./Membership');
const Proposal = require('./Proposal');
const Meeting = require('./Meeting');

const Lobbyist = sequelize.define('Lobbyist', {
    lobbyist_id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    organization_name: DataTypes.STRING,
    registration_number: DataTypes.STRING,
    registration_date: DataTypes.DATE,
    last_update_date: DataTypes.DATE,
    next_update_date: DataTypes.DATE,
    acronym: DataTypes.STRING, 
    entity_form: DataTypes.STRING,
    website: DataTypes.STRING,
    head_office_address: DataTypes.TEXT,
    head_office_phone: DataTypes.STRING,
    eu_office_address: DataTypes.STRING,
    eu_office_phone: DataTypes.STRING,
    legal_representative: DataTypes.STRING,
    legal_representative_role: DataTypes.STRING,
    eu_relations_representative: DataTypes.STRING,
    eu_relations_representative_role: DataTypes.STRING,
    country: DataTypes.STRING,
    transparency_register_url: DataTypes.STRING,
}, {
    tableName: 'lobbyist_profile',
    timestamps: false,
});

// Associazioni
Lobbyist.belongsToMany(Field, {
    through: 'lobbyist_fields_of_interest',
    foreignKey: 'lobbyist_id',
    otherKey: 'field_id',
    timestamps: false,
});

Field.belongsToMany(Lobbyist, {
    through: 'lobbyist_fields_of_interest',
    foreignKey: 'field_id',
    otherKey: 'lobbyist_id',
    timestamps: false,
});

Lobbyist.belongsToMany(Membership, {
    through: 'lobbyist_memberships',
    foreignKey: 'lobbyist_id',
    otherKey: 'membership_id',
});

Lobbyist.belongsToMany(Proposal, {
    through: 'lobbyist_proposals',
    foreignKey: 'lobbyist_id',
    otherKey: 'proposal_id',
});

Lobbyist.hasMany(Meeting, {
    foreignKey: 'lobbyist_id',
    targetKey: 'lobbyist_id',
});

Meeting.belongsTo(Lobbyist, {
    foreignKey: 'lobbyist_id',
    targetKey: 'lobbyist_id',
});

module.exports = Lobbyist;
