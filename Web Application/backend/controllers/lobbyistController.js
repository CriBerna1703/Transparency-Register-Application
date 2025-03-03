const { Lobbyist, Field, Membership, Proposal, Meeting, RepresentativeAllocation, CommissionRepresentative, Directorate } = require('../models');

module.exports = {
    async getAllLobbyists(req, res) {
        try {
            const lobbyists = await Lobbyist.findAll({
                attributes: ['lobbyist_id', 'organization_name'],
            });
            res.json(lobbyists);
        } catch (error) {
            res.status(500).json({ error: 'Errore nel recupero dei lobbyist.' });
        }
    },

    async getLobbyistById(req, res) {
        try {
            const { lobbyist_id } = req.params;
            const lobbyist = await Lobbyist.findByPk(lobbyist_id);
            if (!lobbyist) {
                return res.status(404).json({ error: 'Lobbyist non trovato.' });
            }
            res.json(lobbyist);
        } catch (error) {
            res.status(500).json({ error: 'Errore nel recupero del lobbyist.' });
        }
    },

    async getLobbyistDetails(req, res) {
        try {
            const { lobbyist_id } = req.params;

            const lobbyist = await Lobbyist.findByPk(lobbyist_id, {
                include: [
                    {
                        model: Field,
                        required: false,
                        through: { attributes: [] }, // Escludi metadati della tabella intermedia
                    },
                    {
                        model: Membership,
                        required: false,
                        through: { attributes: [] },
                    },
                    {
                        model: Proposal,
                        required: false,
                        through: { attributes: [] },
                    },
                    {
                        model: Meeting,
                        required: false,
                        include: [
                            {
                                model: CommissionRepresentative,
                                required: false,
                                include: [
                                    {
                                        model: RepresentativeAllocation,
                                        required: false,
                                        include: [
                                            {
                                                model: Directorate,
                                                required: false,
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });

            if (!lobbyist) {
                return res.status(404).json({ error: 'Lobbyist non trovato.' });
            }

            res.json(lobbyist);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Errore nel recupero delle informazioni del lobbyist.' });
        }
    },
};
