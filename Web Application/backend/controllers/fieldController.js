const { Field, Lobbyist } = require('../models'); 


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
            const fields = await Field.findAll({
                include: [{
                    model: Lobbyist,
                    where: { lobbyist_id }, 
                    attributes: [] 
                }]
            });

            res.json(fields);
        } catch (error) {
            console.error("Errore nel recupero dei campi di interesse:", error);
            res.status(500).json({ error: error.message });
        }
    },
};
 