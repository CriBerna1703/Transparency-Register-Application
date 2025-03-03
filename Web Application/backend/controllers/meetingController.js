const { Meeting, CommissionRepresentative, Directorate, Lobbyist, RepresentativeAllocation, Field } = require('../models');
const { Op, Sequelize } = require('sequelize');

function ensureArray(param) {
    if (!param) return [];
    return Array.isArray(param) ? param : [param];
}

module.exports = {
    async getFilteredMeetings(req, res) {
        try {
            const { filter_type, keywords, date_from, date_to } = req.query;

            const lobbyist_ids = ensureArray(req.query.lobbyist_ids);
            const representative_ids = ensureArray(req.query.representative_ids);
            const directorate_ids = ensureArray(req.query.directorate_ids);
            const field_ids = ensureArray(req.query.field_ids);

            let whereClause = {};

            if (date_from && date_to) {
                whereClause.meeting_date = {
                    [Op.between]: [new Date(date_from), new Date(date_to)],
                };
            }

            if (keywords && keywords.length > 0) {
                const keywordArray = ensureArray(keywords);
                const topicConditions = keywordArray.map((keyword) => ({
                    topic: { [Op.like]: `%${keyword}%` },
                }));
                filter_type === 'AND'
                    ? (whereClause[Op.and] = topicConditions)
                    : (whereClause[Op.or] = topicConditions);
            }

            if (lobbyist_ids.length > 0) {
                whereClause.lobbyist_id = { [Op.or]: lobbyist_ids };
            }

            let representativeWhereClause = {};
            if (representative_ids.length > 0) {
                representativeWhereClause.id = { [Op.or]: representative_ids };
            }

            let directorateWhereClause = {};
            if (directorate_ids.length > 0) {
                directorateWhereClause.id = { [Op.or]: directorate_ids };
            }

            let fieldWhereClause = {};
            if (field_ids.length > 0) {
                fieldWhereClause.field_id = { [Op.or]: field_ids };
            }

            const meetings = await Meeting.findAll({
                where: whereClause,
                include: [
                    {
                        model: CommissionRepresentative,
                        required: representative_ids.length > 0 || directorate_ids.length > 0,
                        where: representativeWhereClause,
                        include: [
                            {
                                model: RepresentativeAllocation,
                                required: directorate_ids.length > 0,
                                where: Sequelize.literal('YEAR(Meeting.meeting_date) = `CommissionRepresentative->RepresentativeAllocations`.year'),
                                include: [
                                    {
                                        model: Directorate,
                                        required: directorate_ids.length > 0,
                                        where: directorateWhereClause,
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        model: Lobbyist,
                        required: true,
                        include: [
                            {
                                model: Field,
                                required: field_ids.length > 0,
                                where: fieldWhereClause,
                            },
                        ],
                    },
                ],
            });

            res.json(meetings);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Errore nel recupero degli incontri.', details: error.message });
        }
    },

    // Funzione esistente per recuperare gli incontri di un lobbyist
    async getMeetingsByLobbyist(req, res) {
        try {
            const { lobbyist_id } = req.params;
            const meetings = await Meeting.findAll({ where: { lobbyist_id } });
            res.json(meetings);
        } catch (error) {
            res.status(500).json({ error: 'Errore nel recupero degli incontri.', details: error.message });
        }
    },

    // Nuovo metodo per recuperare un incontro filtrando per lobbyist_id e meeting_number
    async getMeetingByLobbyistAndNumber(req, res) {
        try {
            const { lobbyist_id, meeting_number } = req.params;

            const meeting = await Meeting.findOne({
                where: { lobbyist_id, meeting_number },
                include: [
                    {
                        model: CommissionRepresentative,
                        required: false,
                        include: [
                            {
                                model: RepresentativeAllocation,
                                required: false,
                                where: Sequelize.literal('YEAR(Meeting.meeting_date) = `CommissionRepresentative->RepresentativeAllocations`.year'),
                                include: [
                                    {
                                        model: Directorate,
                                        required: false,
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        model: Lobbyist,
                        required: false,
                    },
                ],
            });

            if (meeting) {
                res.json(meeting);
            } else {
                res.status(404).json({ error: 'Meeting non trovato.' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Errore nel recupero dell\'incontro.', details: error.message });
        }
    },
};
