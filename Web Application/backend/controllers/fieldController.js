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
            console.log("Lobbyist ID ricevuto:", lobbyist_id);

            const fields = await Field.findAll({
                include: [{
                    model: Lobbyist,
                    where: { lobbyist_id }, 
                    attributes: [] 
                }]
            });

            console.log("Campi trovati:", fields);
            res.json(fields);
        } catch (error) {
            console.error("Errore nel recupero dei campi di interesse:", error);
            res.status(500).json({ error: error.message });
        }
    },
};
 