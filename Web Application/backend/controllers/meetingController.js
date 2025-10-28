const { Meeting } = require('../models');
const sequelize = require('../config/db');

function ensureArray(param) {
  if (!param) return [];
  return Array.isArray(param) ? param : [param];
}

module.exports = {

  async getFilteredMeetings(req, res) {
    try {
      const {
        filter_type,
        keywords,
        date_from,
        date_to,
        lobbyist_ids,
        representative_ids,
        directorate_ids,
        field_ids,
        cabinet_ids,
        minBudget,
        maxBudget,
        meeting_number
      } = req.body;

      let whereClauses = [];
      let params = [];

      // --- Date range ---
      if (date_from && date_to) {
        whereClauses.push("cm.meeting_date BETWEEN ? AND ?");
        params.push(date_from, date_to);
      }

      // --- Meeting number ---
      if (meeting_number) {
        whereClauses.push("cm.meeting_number = ?");
        params.push(meeting_number);
      }

      // --- Keywords ---
      if (keywords && keywords.length) {
        const kws = Array.isArray(keywords) ? keywords : [keywords];
        const keywordConditions = kws.map(kw => 
          kw.startsWith('"') && kw.endsWith('"') ? "cm.topic REGEXP ?" : "cm.topic LIKE ?"
        );
        whereClauses.push(`(${keywordConditions.join(filter_type === 'AND' ? ' AND ' : ' OR ')})`);
        kws.forEach(kw => {
          if (kw.startsWith('"') && kw.endsWith('"')) {
            params.push(`(^|[\\s.,;!?()/:\\-])${kw.slice(1, -1)}([\\s.,;!?()/:\\-]|$)`);
          } else {
            params.push(`%${kw}%`);
          }
        });
      }

      // --- Filtri su ID ---
      const lobbyistArr = ensureArray(lobbyist_ids);
      const reprArr = ensureArray(representative_ids);
      const dirArr = ensureArray(directorate_ids);
      const cabArr = ensureArray(cabinet_ids);
      const fieldArr = ensureArray(field_ids);

      if (lobbyistArr.length) {
        whereClauses.push(`cm.lobbyist_id IN (${lobbyistArr.map(() => '?').join(',')})`);
        params.push(...lobbyistArr);
      }
      if (reprArr.length) {
        whereClauses.push(`cr.id IN (${reprArr.map(() => '?').join(',')})`);
        params.push(...reprArr);
      }
      if (dirArr.length) {
        whereClauses.push(`d.id IN (${dirArr.map(() => '?').join(',')})`);
        params.push(...dirArr);
      }
      if (cabArr.length) {
        whereClauses.push(`cc.id IN (${cabArr.map(() => '?').join(',')})`);
        params.push(...cabArr);
      }
      if (fieldArr.length) {
        whereClauses.push(`fi.id IN (${fieldArr.map(() => '?').join(',')})`);
        params.push(...fieldArr);
      }

      // --- Filtri budget ---
      if (minBudget && maxBudget) {
        whereClauses.push("(lp.annual_cost_estimate_min <= ? AND lp.annual_cost_estimate_max >= ?)");
        params.push(maxBudget, minBudget);
      } else if (minBudget) {
        whereClauses.push("lp.annual_cost_estimate_max >= ?");
        params.push(minBudget);
      } else if (maxBudget) {
        whereClauses.push("lp.annual_cost_estimate_min <= ?");
        params.push(maxBudget);
      }

      // --- Query SQL finale ---
      const query = `
        WITH latest_allocation AS (
          SELECT
            ra.*,
            ROW_NUMBER() OVER (PARTITION BY ra.representative_id, ra.year ORDER BY ra.id DESC) AS rn
          FROM representative_allocation ra
        )
        SELECT DISTINCT
          lp.lobbyist_id,
          lp.organization_name,
          cr.id AS representative_id,
          cr.name AS representative_name,
          d.id AS directorate_id,
          d.name AS directorate_name,
          dg_alloc.dg_start_year,
          dg_alloc.dg_end_year,
          dg_alloc.was_commissioner,
          cc.id AS cabinet_id,
          cc.name AS cabinet_name,
          cab_alloc.cabinet_start_year,
          cab_alloc.cabinet_end_year,
          cm.meeting_number,
          cm.meeting_date,
          cm.topic,
          cm.location,
          ra.role as representative_role,
          ra.year as representative_year
        FROM commission_meetings AS cm
        LEFT JOIN meeting_representatives AS mr
          ON cm.lobbyist_id = mr.lobbyist_id AND cm.meeting_number = mr.meeting_number
        LEFT JOIN commission_representative AS cr
          ON mr.representative_id = cr.id
        LEFT JOIN latest_allocation AS ra
          ON cr.id = ra.representative_id
          AND ra.year = YEAR(cm.meeting_date)
          AND ra.rn = 1
        LEFT JOIN directorate AS d
          ON ra.directorate_id = d.id
        LEFT JOIN (
          SELECT
            representative_id,
            directorate_id,
            MIN(year) AS dg_start_year,
            MAX(year) AS dg_end_year,
            MAX(CASE WHEN LOWER(role) = 'commissario' THEN 1 ELSE 0 END) AS was_commissioner
          FROM representative_allocation
          GROUP BY representative_id, directorate_id
        ) dg_alloc
          ON cr.id = dg_alloc.representative_id
          AND d.id = dg_alloc.directorate_id
        LEFT JOIN commission_cabinet AS cc
          ON mr.cabinet_id = cc.id
        LEFT JOIN (
          SELECT representative_id, cabinet_id, MIN(YEAR(cm.meeting_date)) AS cabinet_start_year, MAX(YEAR(cm.meeting_date)) AS cabinet_end_year
          FROM meeting_representatives mr
          JOIN commission_meetings cm
            ON mr.lobbyist_id = cm.lobbyist_id
            AND mr.meeting_number = cm.meeting_number
          WHERE mr.cabinet_id IS NOT NULL
          GROUP BY representative_id, cabinet_id
        ) cab_alloc
          ON cr.id = cab_alloc.representative_id
          AND cc.id = cab_alloc.cabinet_id
        INNER JOIN lobbyist_profile AS lp
          ON cm.lobbyist_id = lp.lobbyist_id
        LEFT JOIN lobbyist_fields_of_interest AS lfi
          ON lp.lobbyist_id = lfi.lobbyist_id
        LEFT JOIN fields_of_interest AS fi
          ON lfi.field_id = fi.field_id
        ${whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : ''}
        ORDER BY cm.meeting_date DESC
      `;

      const [rows] = await sequelize.query(query, { replacements: params });

      // --- Riorganizzazione risultati ---
      const meetingsMap = {};
      rows.forEach(row => {
        const key = `${row.lobbyist_id}_${row.meeting_number}`;
        if (!meetingsMap[key]) {
          meetingsMap[key] = {
            lobbyist_profile: {
              lobbyist_id: row.lobbyist_id,
              organization_name: row.organization_name
            },
            commission_meetings: {
              lobbyist_id: row.lobbyist_id,
              meeting_number: row.meeting_number,
              meeting_date: row.meeting_date,
              topic: row.topic,
              location: row.location
            },
            participants: []
          };
        }

        if (row.representative_id || row.directorate_id || row.cabinet_id) {
          meetingsMap[key].participants.push({
            commission_representative: {
              id: row.representative_id,
              name: row.representative_name
            },
            directorate: {
              id: row.directorate_id,
              name: row.directorate_name,
              start_year: row.dg_start_year,
              end_year: row.dg_end_year,
              is_commissioner: row.was_commissioner === 1
            },
            allocation: {
              role: row.representative_role,
              year: row.representative_year
            },
            commission_cabinet: {
              id: row.cabinet_id,
              name: row.cabinet_name,
              start_year: row.cabinet_start_year,
              end_year: row.cabinet_end_year
            }
          });
        }
      });

      res.json(Object.values(meetingsMap));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Errore nel recupero degli incontri.', details: error.message });
    }
  },

  async getMeetingsByLobbyist(req, res) {
    try {
      const { lobbyist_id } = req.params;
      const meetings = await Meeting.findAll({ where: { lobbyist_id } });
      res.json(meetings);
    } catch (error) {
      res.status(500).json({ error: 'Errore nel recupero degli incontri.', details: error.message });
    }
  }
};
