const { CommissionRepresentative } = require('../models');
const sequelize = require('../config/db');

module.exports = {
    async getAllRepresentatives(req, res) {
        try {
            const query = `
            SELECT DISTINCT
                r.id   AS representative_id,
                r.name AS representative_name,
                c.id   AS cabinet_id,
                c.name AS cabinet_name,
                rc.id as cabinet_representative_id
            FROM commission_representative r
            LEFT JOIN meeting_representatives m ON m.representative_id = r.id
            LEFT JOIN commission_cabinet c ON c.id = m.cabinet_id
            LEFT JOIN commission_representative rc ON c.name = rc.name;
            `;

            const [rows] = await sequelize.query(query);

            if (!rows.length) {
            return res.json([]);
            }

            const representativesMap = new Map();

            rows.forEach(row => {
            if (!representativesMap.has(row.representative_id)) {
                representativesMap.set(row.representative_id, {
                id: row.representative_id,
                name: row.representative_name,
                cabinets: []
                });
            }

            if (row.cabinet_id) {
                const rep = representativesMap.get(row.representative_id);

                if (!rep.cabinets.find(c => c.id === row.cabinet_id)) {
                rep.cabinets.push({
                    id: row.cabinet_id,
                    name: row.cabinet_name,
                    representative_id: row.cabinet_representative_id
                });
                }
            }
            });

            res.json(Array.from(representativesMap.values()));

        } catch (error) {
            console.error(error);
            res.status(500).json({
            error: 'Errore nel recupero dei rappresentanti della Commissione.',
            details: error.message
            });
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
