SELECT
    cr.name,
    TRIM(BOTH ',' FROM CONCAT(        
        CASE WHEN EXISTS (
            SELECT 1 
            FROM representative_allocation ra 
            WHERE ra.representative_id = cr.id
        ) THEN 'Ha ruolo in DG o Commissariato,' ELSE '' END,
        
        CASE WHEN EXISTS (
            SELECT 1 
            FROM commission_cabinet cc 
            WHERE cc.name = cr.name
        ) THEN 'Commissario,' ELSE '' END,
        
		CASE WHEN EXISTS (
            SELECT 1 
            FROM meeting_representatives mr 
            WHERE mr.representative_id = cr.id 
              AND mr.cabinet_id IS NOT NULL
        ) THEN 'Gabinettista,' ELSE '' END,
        
        CASE 
            WHEN NOT EXISTS (
                SELECT 1 FROM meeting_representatives mr 
                WHERE mr.representative_id = cr.id 
                  AND mr.cabinet_id IS NOT NULL
            )
            AND NOT EXISTS (
                SELECT 1 FROM representative_allocation ra 
                WHERE ra.representative_id = cr.id
            )
            AND NOT EXISTS (
                SELECT 1 FROM commission_cabinet cc 
                WHERE cc.name = cr.name
            )
        THEN 'Senza associazioni,' ELSE '' END,
        
        CASE WHEN NOT EXISTS (
            SELECT 1 FROM meeting_representatives mr 
            WHERE mr.representative_id = cr.id
        ) THEN 'Mai in incontri,' ELSE '' END
    )) AS categories
FROM commission_representative cr;
