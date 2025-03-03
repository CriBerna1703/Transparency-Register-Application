const sequelize = require('../config/db');
const Lobbyist = require('./Lobbyist');
const Proposal = require('./Proposal');
const Meeting = require('./Meeting');
const Field = require('./Field');
const Membership = require('./Membership');
const Directorate = require('./Directorate');
const CommissionRepresentative = require('./CommissionRepresentative');
const RepresentativeAllocation = require('./RepresentativeAllocation');

module.exports = {
    sequelize,
    Lobbyist,
    Proposal,
    Meeting,
    Field,
    Membership,
    Directorate,
    CommissionRepresentative,
    RepresentativeAllocation,
};
