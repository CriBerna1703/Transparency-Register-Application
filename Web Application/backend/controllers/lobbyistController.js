const { Lobbyist, Field, Membership, Proposal, Meeting, RepresentativeAllocation, CommissionRepresentative, Directorate, MeetingRepresentative } = require('../models');
const sequelize = require('../config/db');

function ensureArray(param) {
    if (!param) return [];
    return Array.isArray(param) ? param : [param];
}

module.exports = {
    async getAllLobbyists(req, res) {
        try {
            const lobbyists = await Lobbyist.findAll({
                attributes: ['lobbyist_id', 'organization_name'],
                order: [['organization_name', 'ASC']]
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

            const query = `
                SELECT
                    lp.lobbyist_id,
                    lp.organization_name,
                    lp.registration_number,
                    lp.transparency_register_url,
                    lp.registration_date,
                    lp.website,
                    lp.head_office_address,
                    lp.legal_representative,
                    lp.eu_relations_representative,
                    lp.country,
                    lp.annual_cost_estimate_min,
                    lp.annual_cost_estimate_max,
                    lp.category_of_registration,
                    f.field_id,
                    f.field_name,
                    m.membership_id,
                    m.membership_name,
                    p.proposal_id,
                    p.proposal_description
                FROM lobbyist_profile AS lp
                LEFT JOIN lobbyist_fields_of_interest AS lfi
                    ON lp.lobbyist_id = lfi.lobbyist_id
                LEFT JOIN fields_of_interest AS f
                    ON lfi.field_id = f.field_id
                LEFT JOIN lobbyist_memberships AS lm
                    ON lp.lobbyist_id = lm.lobbyist_id
                LEFT JOIN memberships AS m
                    ON lm.membership_id = m.membership_id
                LEFT JOIN lobbyist_proposals AS lp_p
                    ON lp.lobbyist_id = lp_p.lobbyist_id
                LEFT JOIN proposals AS p
                    ON lp_p.proposal_id = p.proposal_id
                WHERE lp.lobbyist_id = ?
            `;

            const [rows] = await sequelize.query(query, { replacements: [lobbyist_id] });

            if (!rows.length) {
                return res.status(404).json({ error: 'Lobbyist non trovato.' });
            }

            const lobbyistProfile = {
                lobbyist_id: rows[0].lobbyist_id,
                organization_name: rows[0].organization_name,
                registration_number: rows[0].registration_number,
                transparency_register_url: rows[0].transparency_register_url,
                registration_date: rows[0].registration_date,
                website: rows[0].website,
                head_office_address: rows[0].head_office_address,
                legal_representative: rows[0].legal_representative,
                eu_relations_representative: rows[0].eu_relations_representative,
                country: rows[0].country,
                annual_cost_estimate_min: rows[0].annual_cost_estimate_min,
                annual_cost_estimate_max: rows[0].annual_cost_estimate_max,
                category_of_registration: rows[0].category_of_registration,
                Fields: [],
                Memberships: [],
                Proposals: [],
            };

            const fieldsSet = new Set();
            const membershipsSet = new Set();
            const proposalsSet = new Set();

            rows.forEach(row => {
                if (row.field_id && !fieldsSet.has(row.field_id)) {
                    fieldsSet.add(row.field_id);
                    lobbyistProfile.Fields.push({ field_id: row.field_id, field_name: row.field_name });
                }
                if (row.membership_id && !membershipsSet.has(row.membership_id)) {
                    membershipsSet.add(row.membership_id);
                    lobbyistProfile.Memberships.push({ membership_id: row.membership_id, membership_name: row.membership_name });
                }
                if (row.proposal_id && !proposalsSet.has(row.proposal_id)) {
                    proposalsSet.add(row.proposal_id);
                    lobbyistProfile.Proposals.push({ proposal_id: row.proposal_id, proposal_description: row.proposal_description });
                }
            });

            res.json(lobbyistProfile);

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Errore nel recupero delle informazioni del lobbyist.', details: error.message });
        }
    },

    async getLobbyistsDetails(req, res) {
        try {
            const lobbyist_ids = typeof req.query.lobbyist_ids === 'string'
            ? req.query.lobbyist_ids.split(',').map(id => id.trim()).filter(Boolean)
            : Array.isArray(req.query.lobbyist_ids)
                ? req.query.lobbyist_ids
                : [];

            if (!lobbyist_ids.length) {
            return res.status(400).json({ error: 'Nessun lobbyist_id fornito.' });
            }

            const query = `
            SELECT
                lp.lobbyist_id,
                lp.organization_name,
                lp.registration_number,
                lp.registration_date,
                lp.last_update_date,
                lp.next_update_date,
                lp.acronym,
                lp.entity_form,
                lp.website,
                lp.head_office_address,
                lp.head_office_phone,
                lp.eu_office_address,
                lp.eu_office_phone,
                lp.legal_representative,
                lp.legal_representative_role,
                lp.eu_relations_representative,
                lp.eu_relations_representative_role,
                lp.transparency_register_url,
                lp.country,
                lp.annual_cost_estimate_min,
                lp.annual_cost_estimate_max,
                lp.category_of_registration,
                GROUP_CONCAT(DISTINCT fi.field_name ORDER BY fi.field_name SEPARATOR '; ') AS fields_of_interest,
                GROUP_CONCAT(DISTINCT m.membership_name ORDER BY m.membership_name SEPARATOR '; ') AS memberships,
                GROUP_CONCAT(DISTINCT p.proposal_description ORDER BY p.proposal_description SEPARATOR '; ') AS proposals
            FROM lobbyist_profile AS lp
            LEFT JOIN lobbyist_fields_of_interest AS lfi
                ON lp.lobbyist_id = lfi.lobbyist_id
            LEFT JOIN fields_of_interest AS fi
                ON lfi.field_id = fi.field_id
            LEFT JOIN lobbyist_memberships AS lm
                ON lp.lobbyist_id = lm.lobbyist_id
            LEFT JOIN memberships AS m
                ON lm.membership_id = m.membership_id
            LEFT JOIN lobbyist_proposals AS lpj
                ON lp.lobbyist_id = lpj.lobbyist_id
            LEFT JOIN proposals AS p
                ON lpj.proposal_id = p.proposal_id
            WHERE lp.lobbyist_id IN (:lobbyist_ids)
            GROUP BY lp.lobbyist_id
            ORDER BY lp.organization_name ASC;
            `;

            const [rows] = await sequelize.query(query, {
            replacements: { lobbyist_ids },
            });

            res.json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({
            error: 'Errore durante il recupero dei dettagli dei lobbisti.',
            details: error.message,
            });
        }
    }


};
