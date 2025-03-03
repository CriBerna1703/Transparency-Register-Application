const { Directorate } = require('../models');

module.exports = {
    async getAllDirectorates(req, res) {
        try {
            const directorates = await Directorate.findAll();
            res.json(directorates);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Errore nel recupero delle direzioni.' });
        }
    },

    async getDirectorateById(req, res) {
        try {
            const { id } = req.params;
            const directorate = await Directorate.findByPk(id);
            if (!directorate) {
                return res.status(404).json({ error: 'Direzione non trovata.' });
            }
            res.json(directorate);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Errore nel recupero della direzione.' });
        }
    },
};
