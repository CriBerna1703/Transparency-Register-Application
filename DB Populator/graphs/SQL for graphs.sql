-- commission_meetings graph
SELECT 
    num_meetings, 
    COUNT(*) AS num_lobbyists
FROM (
    SELECT 
        lobbyist_id, 
        COUNT(meeting_number) AS num_meetings
    FROM 
        commission_meetings
    GROUP BY 
        lobbyist_id
) subquery
GROUP BY 
    num_meetings
ORDER BY 
    num_meetings;


-- fields_of_interest graph
SELECT 
    f.field_name AS sector, 
    COUNT(lfi.lobbyist_id) AS num_lobbyists
FROM 
    fields_of_interest f
JOIN 
    lobbyist_fields_of_interest lfi 
ON 
    f.field_id = lfi.field_id
GROUP BY 
    f.field_name
ORDER BY 
    num_lobbyists DESC;
