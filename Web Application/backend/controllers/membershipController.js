const { Membership, LobbyistMembership } = require('../models');

module.exports = {
    async getAllMemberships(req, res) {
        try {
            const memberships = await Membership.findAll();
            res.json(memberships);
        } catch (error) {
            res.status(500).json({ error: 'Errore nel recupero delle membership.' });
        }
    },

    async getMembershipsByLobbyist(req, res) {
        try {
            const { lobbyist_id } = req.params;
            const memberships = await LobbyistMembership.findAll({
                where: { lobbyist_id },
                include: [{ model: Membership }],
            });
            res.json(memberships);
        } catch (error) {
            res.status(500).json({ error: 'Errore nel recupero delle membership.' });
        }
    },
};
