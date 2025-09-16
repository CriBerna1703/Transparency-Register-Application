const { CommissionCabinet } = require('../models');

module.exports = {
    async getCabinetById(req, res) {
        try {
            const { id } = req.params;
            const cabinet = await CommissionCabinet.findByPk(id);
            if (!cabinet) {
                return res.status(404).json({ error: 'Cabinet not found.' });
            }
            res.json(cabinet);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Errore nel recupero del cabinet.' });
        }
    },
};
