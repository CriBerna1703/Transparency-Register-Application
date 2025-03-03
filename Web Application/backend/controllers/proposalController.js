const { Proposal, LobbyistProposal } = require('../models');

module.exports = {
    async getAllProposals(req, res) {
        try {
            const proposals = await Proposal.findAll();
            res.json(proposals);
        } catch (error) {
            res.status(500).json({ error: 'Errore nel recupero delle proposte legislative.' });
        }
    },

    async getProposalsByLobbyist(req, res) {
        try {
            const { lobbyist_id } = req.params;
            const proposals = await LobbyistProposal.findAll({
                where: { lobbyist_id },
                include: [{ model: Proposal }],
            });
            res.json(proposals);
        } catch (error) {
            res.status(500).json({ error: 'Errore nel recupero delle proposte legislative.' });
        }
    },
};
