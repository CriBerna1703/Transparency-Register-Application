const { Field, LobbyistField } = require('../models');

module.exports = {
    async getAllFields(req, res) {
        try {
            const fields = await Field.findAll();
            res.json(fields);
        } catch (error) {
            res.status(500).json({ error: 'Errore nel recupero dei campi di interesse.' });
        }
    },

    async getFieldsByLobbyist(req, res) {
        try {
            const { lobbyist_id } = req.params;
            const fields = await LobbyistField.findAll({
                where: { lobbyist_id },
                include: [{ model: Field }],
            });
            res.json(fields);
        } catch (error) {
            res.status(500).json({ error: 'Errore nel recupero dei campi di interesse per il lobbyist.' });
        }
    },
};
