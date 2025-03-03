const { CommissionRepresentative } = require('../models');

module.exports = {
    async getAllRepresentatives(req, res) {
        try {
            const representatives = await CommissionRepresentative.findAll();
            res.json(representatives);
        } catch (error) {
            res.status(500).json({ error: 'Errore nel recupero dei rappresentanti della Commissione.' });
        }
    },

    async getRepresentativeById(req, res) {
        try {
            const { id } = req.params;
            const representative = await CommissionRepresentative.findByPk(id);

            if (!representative) {
                return res.status(404).json({ error: 'Rappresentante non trovato.' });
            }

            res.json(representative);
        } catch (error) {
            res.status(500).json({ error: 'Errore nel recupero del rappresentante della Commissione.' });
        }
    },
};
