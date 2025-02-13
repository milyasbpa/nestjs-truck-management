-- id=query_simpang_bayah
WITH simpang_bayah_polygon AS (
    SELECT 
        ST_GeomFromText(ST_AsText(area), 4326) AS geom 
    FROM 
        geofences g 
    WHERE 
        g.name ILIKE '%simpang%bayah%' 
    LIMIT 1
),
truck_data AS (
    SELECT 
        lm.truck_id,
        t.typeoftruck,
        lm.nomor_lambung,
        lm.lat,
        lm.lng,
        lm.geofence,
        lm.status,
        lm.speed,
        lm.course,
        lm.gps_time,
        DEGREES(ATAN2(
            SIN(RADIANS(115.6427 - lm.lng)) * COS(RADIANS(-3.7381)),
            COS(RADIANS(lm.lat)) * SIN(RADIANS(-3.7381)) - 
            SIN(RADIANS(lm.lat)) * COS(RADIANS(-3.7381)) * COS(RADIANS(115.6427 - lm.lng))
        )) AS bearing_to_bayah, -- Hitung arah ke Simpang Bayah
        ST_DistanceSphere(ST_SetSRID(ST_MakePoint(lm.lng, lm.lat), 4326), 
                          ST_SetSRID(ST_MakePoint(115.6427, -3.7381), 4326)) AS distance_to_bayah
    FROM 
        last_truck_movement lm
    JOIN 
        trucks t 
    ON 
        t.id = lm.truck_id
),
filtered_trucks AS (
    SELECT 
        td.*,
        CASE
            WHEN ST_Within(ST_SetSRID(ST_MakePoint(td.lng, td.lat), 4326), polygon.geom) THEN 'In Simpang Bayah'
            ELSE 'Before Simpang Bayah'
        END AS area
    FROM 
        truck_data td
    CROSS JOIN 
        simpang_bayah_polygon AS polygon
    WHERE 
        -- Kendaraan hanya diikutkan jika mengarah ke Simpang Bayah
        ABS(td.course - td.bearing_to_bayah) <= 30 AND 
        -- Kendaraan dalam radius 1 km atau berada dalam area poligon Simpang Bayah
        (td.distance_to_bayah <= 1000 OR 
         ST_Within(ST_SetSRID(ST_MakePoint(td.lng, td.lat), 4326), polygon.geom)) AND 
        -- Kendaraan harus bergerak
        td.speed > 0
)
SELECT 
    ft.truck_id,
    ft.typeoftruck,
    ft.nomor_lambung,
    ft.lat,
    ft.lng,
    ft.geofence,
    ft.status,
    ft.speed,
    ft.course,
    ft.gps_time,
    ft.area,
    ROUND(MIN(ST_DistanceSphere(ST_SetSRID(ST_MakePoint(ft.lng, ft.lat), 4326), 
                                ST_SetSRID(ST_MakePoint(ft2.lng, ft2.lat), 4326)))::numeric, 2) AS closest_vehicle_distance
FROM 
    filtered_trucks ft
JOIN 
    filtered_trucks ft2 
ON 
    ft.truck_id != ft2.truck_id
GROUP BY 
    ft.truck_id, ft.typeoftruck, ft.nomor_lambung, ft.lat, ft.lng, ft.geofence, ft.status, 
    ft.speed, ft.course, ft.gps_time, ft.area,ft.distance_to_bayah
ORDER BY 
    ft.distance_to_bayah, closest_vehicle_distance;


-- id=query_rule_simpangbayah    
    SELECT ln.id, ln.max_capacity 
    FROM queue_lane  ln
    JOIN queue_lane_rules rb ON ln.id = rb.queue_lane_id
    WHERE rb.truck_type =$1 AND ln.max_capacity>=(select coalesce((SELECT COUNT(1) from cp_queue_assignments cp where cp.lane_id=ln.id and exit_time is null group by cp.lane_id),0))
    LIMIT 1  
    

-- id=query_rule_lane
	 	select sum(max_capacity) max_capacity,(SELECT count(1) FROM cp_queue_assignments cq WHERE 
	 	(cq.status='IN-SB' OR cq.status='WAITING') AND cq.truck_type=rb.truck_type   AND cq.lane_id=rb.queue_lane_id ) as current_count from queue_lane_rules rb where queue_lane_id=$1 AND truck_type=$2  group by queue_lane_id,truck_type  

-- id=query_rule_lane_no_truck_type
      with cteoflanes as (
	 	select sum(max_capacity) max_capacity, id from queue_lane rb where id=$1   group by id  
	 ) 
	 SELECT COUNT(*) as current_count
     FROM cp_queue_assignments  cq
     JOIN cteoflanes  ml ON cq.lane_id = ml.id
     where (cq.status='IN-SB' OR cq.status='WAITING') 

-- id=add_truck_queue
    INSERT INTO cp_queue_assignments (truck_id,lane_id,truck_type,driver_name,lane_sb,status,entrance_time)
    VALUES ($1, $2, $3,$4,$5,'IN-SB',NOW()) on conflict (keylocked) do nothing;

-- id=add_truck_undetected
    INSERT INTO cp_queue_assignments (truck_id,cp_queue_id,truck_type,status,entrance_time,exit_time,created_by)
    VALUES ($1, $2, $3,'ASSIGNED_TO_CP',NOW(),NOW(),$4) on conflict (keylocked) do nothing;
  
-- id=import_geofences
    INSERT INTO geofences (geofence_id,name, area,geotype,created_at) 
    VALUES ($1, $2, ST_GeomFromText($3),$4, now()) ON CONFLICT(geofence_id) 
    DO UPDATE SET 
    name=EXCLUDED.name,
    area=ST_GeomFromText($3),
    geotype=EXCLUDED.geotype,
    auditupdate=now();

-- id=import_streets
    INSERT INTO streets (
    street_id, street_user, street_name, street_alias,
    street_polygon, street_type, street_group, street_company,
    street_order, street_created
    ) VALUES (
    $1, $2, $3, $4, ST_GeomFromText($5, 4326), $6, $7, $8, $9, $10
    ) ON CONFLICT (street_id) DO UPDATE SET
    street_user = EXCLUDED.street_user,
    street_name = EXCLUDED.street_name,
    street_alias = EXCLUDED.street_alias,
    street_polygon = ST_GeomFrocimText($5, 4326),
    street_type = EXCLUDED.street_type,
    street_group = EXCLUDED.street_group,
    street_company = EXCLUDED.street_company,
    street_order = EXCLUDED.street_order,
    street_created = EXCLUDED.street_created;

-- id=lanes    
   select id,lane_code,lane_name,max_capacity,ideal_speed,status,travel_point_time,geofence_id,description,safety_distance,created_at,auditupdate,created_by,updated_by from lanes
-- id=query_cp_queue_assignment
   select assignment_id,truck_id,truck_type ,cp_queue_id,entrance_time ,exit_time from cp_queue_assignments cqa  where exit_time is null order by entrance_time asc;
-- id=last_job_executed
   INSERT INTO logs.last_job_executed(job_name,created_at,auditupdate) 
   VALUES ($1,NOW(),NOW()) ON CONFLICT(job_name) DO UPDATE SET 
   auditupdate=NOW();      
-- id=summary_cp_queue
--     SELECT json_build_object(
--     'last_updated',
--         (SELECT auditupdate 
--          FROM logs.last_job_executed lje 
--          WHERE job_name='job-monitor-simpang-bayah' 
--          LIMIT 1),
--     'sum_queue_in_cp',
--         (SELECT COUNT(1)
--          FROM cp_queue_assignments cqa 
--          INNER JOIN queue_lane l ON cqa.lane_id = l.id
--          INNER JOIN trucks t ON cqa.truck_id = t.id
--          WHERE cqa.exit_time IS NULL
--          AND cqa.status = 'WAITING'
--          AND l.status = ANY($1)
--          AND cqa.lane_id IS NOT NULL),
--     'lane_info',
--         (
--             SELECT jsonb_agg(a)
--             FROM (
--                 SELECT
--                     l.id,
--                     l.lane_name,
--                     l.max_capacity,
--                     l.positioning,
--                     (
--                         SELECT array_agg(abbreviate_words(t.typeoftruck))
--                         FROM (
--                             SELECT t.typeoftruck
--                             FROM cp_queue_assignments cqa
--                             INNER JOIN trucks t ON cqa.truck_id = t.id
--                             WHERE cqa.lane_id = l.id
--                             AND cqa.exit_time IS NULL
--                             AND cqa.status = 'WAITING'
--                             AND cqa.lane_id IS NOT NULL
--                             GROUP BY t.typeoftruck
--                         ) t 
--                         GROUP BY abbreviate_words(t.typeoftruck)
--                     ) AS listoftrucktype,
--                     l.status,
--                     COALESCE(
--                         (
--                             SELECT jsonb_agg(jsonb_build_object(
--                                 'assignment_id', cqa.assignment_id,
--                                 'truck_id', cqa.truck_id,
--                                 'nomor_lambung', t.nomor_lambung,
--                                 'driver', cqa.driver_name
--                             ))
--                             FROM cp_queue_assignments cqa
--                             INNER JOIN trucks t ON cqa.truck_id = t.id
--                             WHERE cqa.lane_id = l.id
--                             AND cqa.exit_time IS NULL
--                             AND cqa.status = 'WAITING'
--                             AND cqa.lane_id IS NOT NULL
--                         ),
--                         '[]'
--                     ) AS truck_info
--                 FROM queue_lane l 
--                 WHERE l.status = ANY($1)
--                 ORDER BY l.positioning ASC
--             ) a
--         )
-- ) result;
    SELECT json_build_object(
    'last_updated',
        (SELECT auditupdate 
         FROM logs.last_job_executed lje 
         WHERE job_name='job-monitor-simpang-bayah' 
         LIMIT 1),
    'sum_queue_in_cp',
        (SELECT COUNT(1)
         FROM cp_queue_assignments cqa 
         INNER JOIN queue_lane l ON cqa.lane_id = l.id
         INNER JOIN trucks t ON cqa.truck_id = t.id
         WHERE cqa.exit_time IS NULL
         AND cqa.status = 'WAITING'
         AND l.status = ANY($1)
         AND cqa.lane_id IS NOT NULL),
    'lane_info',
        (
            SELECT jsonb_agg(a)
            FROM (
                SELECT
                    l.id,
                    l.lane_name,
                    l.max_capacity,
                    l.positioning,
                    l.audit_update,
                    (
                        SELECT array_agg(DISTINCT abbreviate_words(t.typeoftruck))  -- Add DISTINCT to avoid duplicates
                        FROM (
                            SELECT t.typeoftruck
                            FROM cp_queue_assignments cqa
                            INNER JOIN trucks t ON cqa.truck_id = t.id
                            WHERE cqa.lane_id = l.id
                            AND cqa.exit_time IS NULL
                            AND cqa.status = 'WAITING'
                            AND cqa.lane_id IS NOT NULL
                            GROUP BY t.typeoftruck
                        ) t 
                    ) AS listoftrucktype,
                    l.status,
                    COALESCE(
                        (
                            SELECT jsonb_agg(jsonb_build_object(
                                'assignment_id', cqa.assignment_id,
                                'truck_id', cqa.truck_id,
                                'nomor_lambung', cqa.nomor_lambung,
                                'driver', cqa.driver_name
                            ))
                            FROM cp_queue_assignments cqa
                            INNER JOIN trucks t ON cqa.truck_id = t.id
                            WHERE cqa.lane_id = l.id
                            AND cqa.exit_time IS NULL
                            AND cqa.status = 'WAITING'
                            AND cqa.lane_id IS NOT NULL ::search
                        ),
                        '[]'
                    ) AS truck_info
                FROM queue_lane l              
                WHERE l.status = ANY($1)
                ORDER BY l.positioning ASC
            ) a
        )
) result;


-- id=logs.app_process
   INSERT INTO logs.app_process(log_name,event_type,log_level,detail_message,metadata) 
   VALUES($1,$2,$3,$4,$5::jsonb) ON CONFLICT (log_name,detail_message,created_at_date) DO NOTHING 
   --UPDATE SET 
   --log_name=EXCLUDED.log_name,
   --event_type=EXCLUDED.event_type,
   --log_level=EXCLUDED.log_level,
   --detail_message=EXCLUDED.detail_message,
   --metadata=EXCLUDED.metadata

-- id=select_queue_assignment
    select * from cp_queue_assignments cqa where exit_time is null and exit_cp_time is null and status = 'WAITING' order by assignment_id asc;

-- id=rule_cp_queue_assignment
   SELECT cq.cp_id, cq.max_capacity,
        (select coalesce((SELECT COUNT(1) from cp_queue_assignments cp where exit_time is not null and exit_cp_time is null and lane_id=$1 group by cp.lane_id),0)) as current_load
           FROM cps cq
           JOIN rule_lane_cp cl ON cq.cp_id = cl.cp_id
           WHERE cl.queue_lane_id=$2 AND cq.max_capacity>=(select coalesce((SELECT COUNT(1) from cp_queue_assignments cp where exit_time is not null and exit_cp_time is null and lane_id=$3 group by cp.lane_id),0))
           LIMIT 1

-- id=update_cp_queue_assignment
   update cp_queue_assignments set exit_time = now(), status='ASSIGNED_TO_CP', cp_queue_id = $1, auditupdate=now()  where assignment_id = $2
-- id=query_management_truck_list_new
with trucks_management as (SELECT ltm.truck_id,
    ltm.nomor_lambung,
    ltm.contractor,
    ltm.lat,
    ltm.lng,
    ltm.geofence,
    ltm.status,
    ltm.speed,
    ltm.course,
    ltm.gps_time,
    (SELECT STRING_AGG(LEFT(word, 1), '') 
         FROM REGEXP_SPLIT_TO_TABLE(t.typeoftruck, '\s+') AS word) AS typeoftruck,
    COALESCE(
        (
            SELECT 
                CASE 
                    WHEN lane_id IS NOT NULL AND exit_time IS NULL THEN 'Antrian CP'
                    WHEN cp_queue_id IS NOT NULL AND exit_cp_time IS NULL THEN 'Diarahkan Ke CP'
                    WHEN cp_queue_id IS NOT NULL AND exit_cp_time IS NOT NULL THEN 'Tiba Di CP'
                    ELSE NULL
                END
            FROM cp_queue_assignments a
            WHERE truck_id = ltm.truck_id
            AND a.assignment_id = (
                SELECT assignment_id 
                FROM cp_queue_assignments 
                WHERE truck_id = ltm.truck_id
                ORDER BY auditupdate DESC 
                LIMIT 1
            )
            LIMIT 1
        ),
        (
            CASE
                WHEN EXISTS (SELECT 1 FROM mv_simpang_bayah WHERE truck_id = ltm.truck_id) 
                THEN 'Simpang Bayah'
                ELSE (
                    SELECT geofence 
                    FROM last_truck_movement 
                    WHERE truck_id = ltm.truck_id
                    LIMIT 1
                )
            END
        )
    ) AS status_unit,
    COALESCE(
    (
        SELECT
            CASE
                WHEN cqa.created_by IS NULL AND cqa.updated_by IS NULL THEN 'System'::character varying
                WHEN cqa.updated_by IS NOT NULL AND cqa.created_by IS NULL THEN 
                    (SELECT name FROM users WHERE id = cqa.updated_by LIMIT 1)
                WHEN cqa.created_by IS NOT NULL AND cqa.updated_by IS NULL THEN 
                    (SELECT name FROM users WHERE id = cqa.created_by LIMIT 1)
                WHEN cqa.created_by IS NOT NULL AND cqa.updated_by IS NOT NULL THEN 
                    (SELECT name FROM users WHERE id = cqa.updated_by LIMIT 1)
                ELSE 'Unassigned'::character varying
            END AS "case"
        FROM cp_queue_assignments cqa
        WHERE cqa.truck_id = ltm.truck_id
        ORDER BY cqa.auditupdate DESC
        LIMIT 1
    ),
    ''::character varying
) AS assigned,
   COALESCE(
    (
        SELECT
            CASE
                WHEN cqa.created_by IS NULL AND cqa.updated_by IS NULL THEN 'System'::character varying
                WHEN cqa.updated_by IS NOT NULL AND cqa.created_by IS NULL THEN 
                    (SELECT role_name::varchar FROM users WHERE id = cqa.updated_by LIMIT 1)
                WHEN cqa.created_by IS NOT NULL AND cqa.updated_by IS NULL THEN 
                    (SELECT role_name::varchar FROM users WHERE id = cqa.created_by LIMIT 1)
                WHEN cqa.created_by IS NOT NULL AND cqa.updated_by IS NOT NULL THEN 
                    (SELECT role_name::varchar FROM users WHERE id = cqa.updated_by LIMIT 1)
                ELSE 'Unassigned'::character varying
            END AS "case"
        FROM cp_queue_assignments cqa
        WHERE cqa.truck_id = ltm.truck_id
        ORDER BY cqa.auditupdate DESC
        LIMIT 1
    ),
    ''::character varying
) AS assigned_role,
    (
        SELECT auditupdate 
        FROM cp_queue_assignments 
        WHERE truck_id = ltm.truck_id 
        ORDER BY auditupdate DESC 
        LIMIT 1
    ) AS auditupdate,
    (
        SELECT status 
        FROM cp_queue_assignments 
        WHERE truck_id = ltm.truck_id 
        ORDER BY auditupdate DESC 
        LIMIT 1
    ) AS completed_status,
     (
        SELECT completed_by 
        FROM cp_queue_assignments 
        WHERE truck_id = ltm.truck_id 
        ORDER BY auditupdate DESC 
        LIMIT 1
    ) AS completed_by,
     (
        SELECT case
        	when rt.rfid_reader_in_id is not null
        	then true
        	else false
        end
        FROM rfid_transaction rt
        WHERE truck_id = ltm.truck_id 
        ORDER BY auditupdate DESC 
        LIMIT 1
    ) AS rfid_reader_in_status,
    (
        SELECT 
        case
        	when rt.rfid_reader_in_id is not null
        	then true
        	else false
        	end
        FROM rfid_transaction rt 
        WHERE truck_id = ltm.truck_id 
        ORDER BY auditupdate DESC 
        LIMIT 1
    ) AS rfid_reader_out_status
   FROM last_truck_movement ltm,
    trucks t
  WHERE ltm.truck_id = t.id) 
select 
	tm.truck_id,
	tm.nomor_lambung,
	tm.lat,
	tm.lng,
	tm.geofence,
	tm.speed,
	tm.course,
	tm.gps_time,
	tm.typeoftruck,
	tm.status_unit,
	tm.assigned,
	tm.assigned_role,
	tm.auditupdate,
	tm.completed_status,
	tm.completed_by,
	tm.rfid_reader_in_status,
	tm.rfid_reader_out_status
from trucks_management as tm
-- id=query_management_truck_list
   SELECT truck_id,nomor_lambung,lat,lng,geofence,speed,course,gps_time,typeoftruck,status_unit,assigned,auditupdate FROM mv_truct_management
-- id=query_count_management_truck_list_new
with trucks_management as (SELECT ltm.truck_id,
    ltm.nomor_lambung,
    ltm.contractor,
    ltm.lat,
    ltm.lng,
    ltm.geofence,
    ltm.status,
    ltm.speed,
    ltm.course,
    ltm.gps_time,
    (SELECT STRING_AGG(LEFT(word, 1), '') 
         FROM REGEXP_SPLIT_TO_TABLE(t.typeoftruck, '\s+') AS word) AS typeoftruck,
    COALESCE(
        (
            SELECT 
                CASE 
                    WHEN lane_id IS NOT NULL AND exit_time IS NULL THEN 'Antrian CP'
                    WHEN cp_queue_id IS NOT NULL AND exit_cp_time IS NULL THEN 'Diarahkan Ke CP'
                    WHEN cp_queue_id IS NOT NULL AND exit_cp_time IS NOT NULL THEN 'Tiba Di CP'
                    ELSE NULL
                END
            FROM cp_queue_assignments a
            WHERE truck_id = ltm.truck_id
            AND a.assignment_id = (
                SELECT assignment_id 
                FROM cp_queue_assignments 
                WHERE truck_id = ltm.truck_id
                ORDER BY auditupdate DESC 
                LIMIT 1
            )
            LIMIT 1
        ),
        (
            CASE
                WHEN EXISTS (SELECT 1 FROM mv_simpang_bayah WHERE truck_id = ltm.truck_id) 
                THEN 'Simpang Bayah'
                ELSE (
                    SELECT geofence 
                    FROM last_truck_movement 
                    WHERE truck_id = ltm.truck_id
                    LIMIT 1
                )
            END
        )
    ) AS status_unit,
    COALESCE(
    (
        SELECT
            CASE
                WHEN cqa.created_by IS NULL AND cqa.updated_by IS NULL THEN 'System'::character varying
                WHEN cqa.updated_by IS NOT NULL AND cqa.created_by IS NULL THEN 
                    (SELECT name FROM users WHERE id = cqa.updated_by LIMIT 1)
                WHEN cqa.created_by IS NOT NULL AND cqa.updated_by IS NULL THEN 
                    (SELECT name FROM users WHERE id = cqa.created_by LIMIT 1)
                WHEN cqa.created_by IS NOT NULL AND cqa.updated_by IS NOT NULL THEN 
                    (SELECT name FROM users WHERE id = cqa.updated_by LIMIT 1)
                ELSE 'Unassigned'::character varying
            END AS "case"
        FROM cp_queue_assignments cqa
        WHERE cqa.truck_id = ltm.truck_id
        ORDER BY cqa.auditupdate DESC
        LIMIT 1
    ),
    ''::character varying
) AS assigned,
   COALESCE(
    (
        SELECT
            CASE
                WHEN cqa.created_by IS NULL AND cqa.updated_by IS NULL THEN 'System'::character varying
                WHEN cqa.updated_by IS NOT NULL AND cqa.created_by IS NULL THEN 
                    (SELECT role_name::varchar FROM users WHERE id = cqa.updated_by LIMIT 1)
                WHEN cqa.created_by IS NOT NULL AND cqa.updated_by IS NULL THEN 
                    (SELECT role_name::varchar FROM users WHERE id = cqa.created_by LIMIT 1)
                WHEN cqa.created_by IS NOT NULL AND cqa.updated_by IS NOT NULL THEN 
                    (SELECT role_name::varchar FROM users WHERE id = cqa.updated_by LIMIT 1)
                ELSE 'Unassigned'::character varying
            END AS "case"
        FROM cp_queue_assignments cqa
        WHERE cqa.truck_id = ltm.truck_id
        ORDER BY cqa.auditupdate DESC
        LIMIT 1
    ),
    ''::character varying
) AS assigned_role,
    (
        SELECT auditupdate 
        FROM cp_queue_assignments 
        WHERE truck_id = ltm.truck_id 
        ORDER BY auditupdate DESC 
        LIMIT 1
    ) AS auditupdate,
    (
        SELECT status 
        FROM cp_queue_assignments 
        WHERE truck_id = ltm.truck_id 
        ORDER BY auditupdate DESC 
        LIMIT 1
    ) AS completed_status,
     (
        SELECT completed_by 
        FROM cp_queue_assignments 
        WHERE truck_id = ltm.truck_id 
        ORDER BY auditupdate DESC 
        LIMIT 1
    ) AS completed_by,
     (
        SELECT case
        	when rt.rfid_reader_in_id is not null
        	then true
        	else false
        end
        FROM rfid_transaction rt
        WHERE truck_id = ltm.truck_id 
        ORDER BY auditupdate DESC 
        LIMIT 1
    ) AS rfid_reader_in_status,
    (
        SELECT 
        case
        	when rt.rfid_reader_in_id is not null
        	then true
        	else false
        	end
        FROM rfid_transaction rt 
        WHERE truck_id = ltm.truck_id 
        ORDER BY auditupdate DESC 
        LIMIT 1
    ) AS rfid_reader_out_status
   FROM last_truck_movement ltm,
    trucks t
  WHERE ltm.truck_id = t.id) 
select count(1) total from trucks_management tm
-- id=query_count_management_truck_list
   SELECT count(1) total FROM mv_truct_management
-- id=refresh_mv_truct_management 
   REFRESH MATERIALIZED VIEW mv_truct_management 
-- id=query_management_truck_list_by_id_new
with trucks_management as (SELECT ltm.truck_id,
    ltm.nomor_lambung,
    ltm.contractor,
    ltm.lat,
    ltm.lng,
    ltm.geofence,
    ltm.status,
    ltm.speed,
    ltm.course,
    ltm.gps_time,
    (SELECT STRING_AGG(LEFT(word, 1), '') 
         FROM REGEXP_SPLIT_TO_TABLE(t.typeoftruck, '\s+') AS word) AS typeoftruck,
    COALESCE(
        (
            SELECT 
                CASE 
                    WHEN lane_id IS NOT NULL AND exit_time IS NULL THEN 'Antrian CP'
                    WHEN cp_queue_id IS NOT NULL AND exit_cp_time IS NULL THEN 'Diarahkan Ke CP'
                    WHEN cp_queue_id IS NOT NULL AND exit_cp_time IS NOT NULL THEN 'Tiba Di CP'
                    ELSE NULL
                END
            FROM cp_queue_assignments a
            WHERE truck_id = ltm.truck_id
            AND a.assignment_id = (
                SELECT assignment_id 
                FROM cp_queue_assignments 
                WHERE truck_id = ltm.truck_id
                ORDER BY auditupdate DESC 
                LIMIT 1
            )
            LIMIT 1
        ),
        (
            CASE
                WHEN EXISTS (SELECT 1 FROM mv_simpang_bayah WHERE truck_id = ltm.truck_id) 
                THEN 'Simpang Bayah'
                ELSE (
                    SELECT geofence 
                    FROM last_truck_movement 
                    WHERE truck_id = ltm.truck_id
                    LIMIT 1
                )
            END
        )
    ) AS status_unit,
    COALESCE(
    (
        SELECT
            CASE
                WHEN cqa.created_by IS NULL AND cqa.updated_by IS NULL THEN 'System'::character varying
                WHEN cqa.updated_by IS NOT NULL AND cqa.created_by IS NULL THEN 
                    (SELECT name FROM users WHERE id = cqa.updated_by LIMIT 1)
                WHEN cqa.created_by IS NOT NULL AND cqa.updated_by IS NULL THEN 
                    (SELECT name FROM users WHERE id = cqa.created_by LIMIT 1)
                WHEN cqa.created_by IS NOT NULL AND cqa.updated_by IS NOT NULL THEN 
                    (SELECT name FROM users WHERE id = cqa.updated_by LIMIT 1)
                ELSE 'Unassigned'::character varying
            END AS "case"
        FROM cp_queue_assignments cqa
        WHERE cqa.truck_id = ltm.truck_id
        ORDER BY cqa.auditupdate DESC
        LIMIT 1
    ),
    ''::character varying
) AS assigned,
   COALESCE(
    (
        SELECT
            CASE
                WHEN cqa.created_by IS NULL AND cqa.updated_by IS NULL THEN 'System'::character varying
                WHEN cqa.updated_by IS NOT NULL AND cqa.created_by IS NULL THEN 
                    (SELECT role_name::varchar FROM users WHERE id = cqa.updated_by LIMIT 1)
                WHEN cqa.created_by IS NOT NULL AND cqa.updated_by IS NULL THEN 
                    (SELECT role_name::varchar FROM users WHERE id = cqa.created_by LIMIT 1)
                WHEN cqa.created_by IS NOT NULL AND cqa.updated_by IS NOT NULL THEN 
                    (SELECT role_name::varchar FROM users WHERE id = cqa.updated_by LIMIT 1)
                ELSE 'Unassigned'::character varying
            END AS "case"
        FROM cp_queue_assignments cqa
        WHERE cqa.truck_id = ltm.truck_id
        ORDER BY cqa.auditupdate DESC
        LIMIT 1
    ),
    ''::character varying
) AS assigned_role,
    (
        SELECT auditupdate 
        FROM cp_queue_assignments 
        WHERE truck_id = ltm.truck_id 
        ORDER BY auditupdate DESC 
        LIMIT 1
    ) AS auditupdate,
    (
        SELECT status 
        FROM cp_queue_assignments 
        WHERE truck_id = ltm.truck_id 
        ORDER BY auditupdate DESC 
        LIMIT 1
    ) AS completed_status,
     (
        SELECT completed_by 
        FROM cp_queue_assignments 
        WHERE truck_id = ltm.truck_id 
        ORDER BY auditupdate DESC 
        LIMIT 1
    ) AS completed_by,
     (
        SELECT case
        	when rt.rfid_reader_in_id is not null
        	then true
        	else false
        end
        FROM rfid_transaction rt
        WHERE truck_id = ltm.truck_id 
        ORDER BY auditupdate DESC 
        LIMIT 1
    ) AS rfid_reader_in_status,
    (
        SELECT 
        case
        	when rt.rfid_reader_in_id is not null
        	then true
        	else false
        	end
        FROM rfid_transaction rt 
        WHERE truck_id = ltm.truck_id 
        ORDER BY auditupdate DESC 
        LIMIT 1
    ) AS rfid_reader_out_status
   FROM last_truck_movement ltm,
    trucks t
  WHERE ltm.truck_id = t.id) 
select tm.truck_id,
    tm.nomor_lambung,
    tm.lat,
    tm.lng,
    tm.geofence,
    tm.speed,
    tm.course,
    tm.gps_time,
    tm.typeoftruck,
    tm.status_unit,
    tm.assigned,
    tm.assigned_role,
    tm.auditupdate,
    tm.completed_status,
	tm.completed_by,
	tm.rfid_reader_in_status,
	tm.rfid_reader_out_status,
    (
        SELECT json_agg(history)
        FROM (
            -- Ambil data dari logs.history dengan assign_id IS NULL
            select * from(SELECT 
                h.status, 
                h.description, 
                h.created_at
            FROM logs.truck_history_cp h
            WHERE h.truck_id = tm.truck_id  
              AND h.status='STARTED'
            ORDER BY h.created_at DESC
            LIMIT 1)a
            UNION ALL
            SELECT 
                h.status, 
                h.description, 
                h.created_at
            FROM logs.truck_history_cp h
            WHERE h.truck_id = tm.truck_id 
              AND h.assignment_id = (
                  SELECT c.assignment_id
                  FROM cp_queue_assignments c
                  WHERE c.truck_id = tm.truck_id
                  ORDER BY c.assignment_id DESC
                  LIMIT 1
              )
             order by created_at asc 
              
        ) AS history
    ) AS history_logs
FROM 
    trucks_management tm WHERE tm.truck_id=$1
-- id=query_management_truck_list_by_id
  SELECT 
    a.truck_id,
    a.nomor_lambung,
    a.lat,
    a.lng,
    a.geofence,
    a.speed,
    a.course,
    a.gps_time,
    a.typeoftruck,
    a.status_unit,
    a.assigned,
    a.auditupdate,
    (
        SELECT json_agg(history)
        FROM (
            -- Ambil data dari logs.history dengan assign_id IS NULL
            select * from(SELECT 
                h.status, 
                h.description, 
                h.created_at
            FROM logs.truck_history_cp h
            WHERE h.truck_id = a.truck_id  
              AND h.status='STARTED'
            ORDER BY h.created_at DESC
            LIMIT 1)a
            UNION ALL
            SELECT 
                h.status, 
                h.description, 
                h.created_at
            FROM logs.truck_history_cp h
            WHERE h.truck_id = a.truck_id 
              AND h.assignment_id = (
                  SELECT c.assignment_id
                  FROM cp_queue_assignments c
                  WHERE c.truck_id = a.truck_id
                  ORDER BY c.assignment_id DESC
                  LIMIT 1
              )
             order by created_at asc 
              
        ) AS history
    ) AS history_logs
FROM 
    mv_truct_management a WHERE a.truck_id=$1

-- id=query_cps
    SELECT cp_name FROM cps ORDER BY cp_name ASC
-- id=query_cctv_item_devices
    SELECT cp_name,item_id,device_id,live_condition FROM cctv_device_items WHERE cp_name=$1
-- id=update_cps_status
    UPDATE cps SET status=$1,auditupdate=now() WHERE cp_name=$2
-- id=update_cp_aqueue_from_simpang_bayah
    UPDATE cp_queue_assignments SET lane_id=$1, truck_id=$2, updated_by=$3, auditupdate=now() 
    WHERE assignment_id=$4  
-- id=is_valid_max_lane_before_update
    SELECT COUNT(1) current_load,b.max_capacity, a.lane_id FROM cp_queue_assignments a,queue_lane b  WHERE 
    a.lane_id=b.id
    and lane_id=$1 
    and exit_time is null 
    and truck_id!=$2 
    group by a.lane_id,b.max_capacity
-- id=is_assignment_id_exist
    select count(1) as z_count from cp_queue_assignments WHERE assignment_id=$1
-- id=insert_from_simpang_bayah
    INSERT INTO cp_queue_assignments(lane_id,truck_id,created_by,auditupdate) 
    VALUES($1,$2,$3,now()) on conflict (keylocked) do nothing RETURNING assignment_id
-- id=find_cp_assignment_by_id_reroute_manual
   SELECT assignment_id,lane_id,truck_id,updated_by FROM cp_queue_assignments WHERE 
   assignment_id=$1

-- id=summary_cp_dashboard

SELECT json_build_object(
    'last_updated',
    (
        select auditupdate
        FROM cps order by auditupdate DESC
        LIMIT 1
    ),
    'total_trucks_in_cp',
    (
        SELECT COUNT(1)
        FROM cp_queue_assignments cqa
        INNER JOIN cps ON cqa.cp_queue_id = cps.cp_id
        INNER JOIN trucks t ON cqa.truck_id=t.id
        WHERE cqa.exit_time IS NOT NULL
        ::search
        AND cqa.status != 'COMPLETED'
        AND cps.status = ANY($1)
        AND cqa.cp_queue_id IS NOT NULL
    ),
    'cp_info',
    (
        SELECT jsonb_agg(a)
        FROM (
            SELECT
                cps.cp_id,
                cps.cp_name,
                cps.max_capacity,
                cps.positioning,
                cps.priority_update_status,
                cps.auditupdate,
                (
                    SELECT array_agg(abbreviate_words(t.typeoftruck))
                    FROM (
                        SELECT t.typeoftruck
                        FROM cp_queue_assignments cqa
                        INNER JOIN trucks t ON cqa.truck_id = t.id
                        WHERE cqa.cp_queue_id = cps.cp_id
                        AND cqa.exit_time IS NOT NULL
                        AND cqa.status != 'COMPLETED'
                        AND cqa.cp_queue_id IS NOT NULL
                        ::search
                        GROUP BY t.typeoftruck
                    ) t
                ) AS listoftrucktype,
                COALESCE(
                    (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'name_lane', rlc.name_queue_lane
                            )
                        )
                        FROM rule_lane_cp rlc
                        WHERE rlc.cp_id = cps.cp_id
                    ),
                    '[]'
                ) AS rule_lane,
                COALESCE(
                    (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'name', cpd.cp_entrance_type_name
                            )
                        )
                        FROM cp_entrance_detail cpd
                        WHERE cpd.cp_id = cps.cp_id
                    ),
                    '[]'
                ) AS entrance_details,
                COALESCE(
                    (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'name', ced.cp_exit_type_name
                            )
                        )
                        FROM cp_exit_detail ced
                        WHERE ced.cp_id = cps.cp_id
                    ),
                    '[]'
                ) AS exit_details,
                COALESCE(
                        (
                            SELECT ct.value
                            FROM cp_tonages ct
                            WHERE ct.cp_id = cps.cp_id
                        ),
                        0
                    ) AS tonages,
                cps.status,
                CONCAT(
                    COALESCE(
                        (
                            SELECT COUNT(1)
                            FROM cp_queue_assignments cqa
                            INNER JOIN trucks t ON cqa.truck_id = t.id 
                            WHERE cqa.cp_queue_id = cps.cp_id
                            ::search
                            AND cqa.exit_time IS NOT NULL
                            AND cqa.status != 'COMPLETED'
                            AND cqa.cp_queue_id IS NOT NULL
                        ),
                        0
                    ),
                    '/',
                    cps.max_capacity
                ) AS sum_truck_in_cp,
                COALESCE(
                    (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'assignment_id', cqa.assignment_id,
                                'truck_id', cqa.truck_id,
                                'nomor_lambung', cqa.nomor_lambung,
                                'driver', CONCAT('Driver-', cqa.nomor_lambung)
                            )
                        )
                        FROM cp_queue_assignments cqa
                        INNER JOIN trucks t ON cqa.truck_id = t.id
                        WHERE cqa.cp_queue_id = cps.cp_id
                        ::search
                        AND cqa.exit_time IS NOT NULL
                        AND cqa.status != 'COMPLETED'
                        AND cqa.cp_queue_id IS NOT NULL
                        -- SELECT jsonb_agg(
                        --     jsonb_build_object(
                        --         'assignment_id', cqa.assignment_id,
                        --         'truck_id', cqa.truck_id,
                        --         'nomor_lambung', t.nomor_lambung,
                        --         'driver', CONCAT('Driver-', t.nomor_lambung),
                        --         'status_rfid', rf.event_type,
                        --         'latest_cp',cps.cp_name
                        --     )
                        -- )
                        -- FROM cp_queue_assignments cqa
                        -- INNER JOIN trucks t ON cqa.truck_id = t.id
                        -- INNER JOIN rfid_transaction rf ON rf.truck_id = cqa.truck_id
                        -- INNER JOIN rfid_reader_in ri ON rf.rfid_reader_in_id = ri.rfid_reader_in_id
                        -- INNER JOIN cp_detail cd ON ri.cp_detail_id = cd.cp_detail_id
                        -- WHERE cqa.cp_queue_id = cps.cp_id 
                        -- ::search
                        -- AND cqa.exit_time IS NOT NULL
                        -- AND cqa.status != 'COMPLETED'
                        -- AND cqa.cp_queue_id IS NOT NULL
                        -- AND rf.event_type != 'Completed'
                        -- AND cd.cp_id = cps.cp_id
                    ),
                    '[]'
                ) AS truck_info
            FROM cps
            WHERE cps.status = ANY($1)
            ORDER BY cps.positioning ASC
        ) a
    )
) AS result;

    
    -- SELECT json_build_object(
    -- 'last_updated',
    --     (select auditupdate from logs.last_job_executed lje where job_name='job-monitor-cp' LIMIT 1 ),
    -- 'total_trucks_in_cp',
    --     (SELECT COUNT(1)
    -- FROM cp_queue_assignments cqa INNER JOIN cps 
    -- ON cqa.cp_queue_id=cps.cp_id INNER JOIN 
    -- trucks t ON cqa.truck_id=t.id  ::search
    -- WHERE cqa.cp_queue_id=cps.cp_id AND
    -- cqa.truck_id=t.id
    -- AND cqa.exit_time IS NOT NULL 
    -- AND cqa.status != 'COMPLETED'
    -- AND cps.status = ANY($1)
    -- AND cqa.cp_queue_id IS NOT NULL
    
    -- )
    -- ,
    -- 'cp_info',
    --     (
    --         SELECT jsonb_agg(a)
    --         FROM (
    --             SELECT 
    --                 cps.cp_id, 
    --                 cps.cp_name, 
    --                 cps.max_capacity,
    --                 cps.positioning,
    --                 (
    --                     SELECT array_agg(abbreviate_words(t.typeoftruck))
    --                     FROM (
    --                         SELECT t.typeoftruck
    --                         FROM cp_queue_assignments cqa 
    --                         INNER JOIN trucks t ON cqa.truck_id = t.id
    --                         WHERE cqa.cp_queue_id = cps.cp_id 
    --                         AND cqa.exit_time IS NOT NULL 
    --                         AND cqa.status != 'COMPLETED'
    --                         AND cqa.cp_queue_id IS NOT NULL
    --                         ::search
    --                         GROUP BY t.typeoftruck 
    --             --            #ADDITIONAL
    --                     ) t group by abbreviate_words(t.typeoftruck)
    --                 ) AS listoftrucktype,
    --                 COALESCE(
    --                     (
    --                         SELECT 
    --                             jsonb_agg(
    --                                 jsonb_build_object(
    --                                     'name_lane', rlc.name_queue_lane
    --                                 )
    --                             )
    --                         FROM 
    --                             rule_lane_cp rlc
    --                         WHERE rlc.cp_id = cps.cp_id
    --                     ), 
    --                     '[]'
    --                 ) AS rule_lane,
    --                 cps.status,
    --                 CONCAT(
    --                     COALESCE(
    --                         (SELECT COUNT(1)
    --                         FROM cp_queue_assignments cqa INNER JOIN trucks t 
    --                         ON cqa.truck_id=t.id ::search
    --                         WHERE cqa.cp_queue_id = cps.cp_id 
    --                         AND cqa.truck_id=t.id 
    --                         AND cqa.exit_time IS NOT NULL 
    --                         AND cqa.status != 'COMPLETED'
    --                         AND cqa.cp_queue_id IS NOT NULL
                            
    --                         ), 
    --                         0
    --                     ), 
    --                     '/', 
    --                     cps.max_capacity
    --                 ) AS sum_truck_in_cp,
    --                 COALESCE(
    --                     (
    --                         SELECT 
    --                             jsonb_agg(
    --                                 jsonb_build_object(
    --                                     'assignment_id', cqa.assignment_id,
    --                                     'truck_id', cqa.truck_id,
    --                                     'nomor_lambung', t.nomor_lambung,
    --                                     'driver', CONCAT('Driver-', t.nomor_lambung)
    --                                 )
    --                             )
    --                         FROM 
    --                             cp_queue_assignments cqa
    --                         INNER JOIN 
    --                             trucks t ON cqa.truck_id = t.id
    --                         ::search
    --                         WHERE 
    --                             cqa.cp_queue_id = cps.cp_id 
    --                             AND cqa.exit_time IS NOT NULL 
    --                             AND cqa.status != 'COMPLETED'
    --                             AND cqa.cp_queue_id IS NOT NULL
                           
    --                     ), 
    --                     '[]'
    --                 ) AS truck_info
    --             FROM cps 
    --             where cps.status = ANY($1)
    --             ORDER BY cps.positioning ASC
    --         ) a
    --     )
    -- ) result;

-- id=query_users
    SELECT * FROM users
-- id=query_count_users
    SELECT count(1) FROM users

-- id=prevent_truck_id_before_complated
    select exists(select 1 from cp_queue_assignments cqa 
    where status!='COMPLETED' and truck_id=$1 )
-- id=insert_users     
    INSERT INTO public.users (email, name, username, passw, created_at, created_by,avatar)
    VALUES ($1, $2, $3, $4,NOW(), $5,$6)
    RETURNING id
-- id=update_users
    UPDATE users SET avatar=$1,name=$2,updated_by=$3,updated_at=now() ::condition

-- id=delete_users
    UPDATE users SET deleted=true WHERE id=$1
-- id=delete_user_roles
    DELETE FROM user_roles WHERE user_id=$1 
-- id=insert_user_roles
    INSERT INTO public.user_roles (user_id,menu_id, role_id, created_at)
    VALUES ($1,$2,$3, NOW())    
-- id=query_roles_by_user_id
    SELECT id as user_id,email, username,name,created_at,updated_at,avatar,(SELECT jsonb_agg(a) from(SELECT menu_id,role_id FROM user_roles WHERE user_id=u.id)a) roles FROM users u WHERE u.id=$1
-- id=query_roles
    SELECT * FROM roles
-- id=query_menus
    SELECT * FROM menus   
-- id=query_users_by_id     
    SELECT id,coalesce(email,'') email,name,coalesce(username,'') username FROM users WHERE id=$1
-- id=query_users_by_email_different_user
    SELECT EXISTS(SELECT 1 FROM users WHERE lower(trim(email))=$1 AND id!=$2)
-- id=query_users_by_username_different_user
    SELECT EXISTS(SELECT 1 FROM users WHERE upper(trim(username))=$1 AND id!=$2)
-- id=update_users_password
    UPDATE users SET passw=$1 WHERE id=$2
-- id=update_cp_assignment_queue_from_cp_to_lane
    UPDATE cp_queue_assignments SET cp_queue_id=null, lane_id=$1, truck_id=$2, updated_by=$3,status='WAITING', auditupdate=now(),exit_cp_time=null 
    WHERE assignment_id=$4  
-- id=update_cp_assignment_queue_from_lane_to_cp
    UPDATE cp_queue_assignments SET cp_queue_id=$1, truck_id=$2, updated_by=$3,status='ASSIGNED_TO_CP', auditupdate=now(),exit_cp_time=null,exit_time=now()  
    WHERE assignment_id=$4
-- id=update_cp_assignment_queue_from_cp_to_cp
    UPDATE cp_queue_assignments SET cp_queue_id=$1, truck_id=$2, updated_by=$3,status='ASSIGNED_TO_CP', auditupdate=now(),exit_cp_time=null,exit_time=now()  
    WHERE assignment_id=$4

-- id=query_max_capacity_in_cps
    SELECT max_capacity from cps WHERE cp_id=$1    

-- id=query_max_capacity_in_rule_of_cp
    SELECT max_capacity from rule_of_cp WHERE cp_id=$1
-- id=query_max_capacity_truck_type_in_rule_of_cp
    SELECT SUM(max_capacity) max_capacity from rule_of_cp WHERE cp_id=$1 AND truck_type=$2 group by cp_id 
-- id=query_in_cp_queue_assignment_current_load
    SELECT count(1) current_load FROM cp_queue_assignments WHERE cp_queue_id=$1 AND STATUS!='COMPLETED' AND exit_cp_time!=null
-- id=query_in_cp_queue_assignment_current_load_by_cp_id
    SELECT count(1) current_load FROM cp_queue_assignments cqa WHERE cp_queue_id=$1 AND STATUS!='COMPLETED' AND exit_cp_time!=null AND EXISTS(SELECT 1 FROM trucks t WHERE cqa.truck_id=t.id and t.typeoftruck=$2)
-- id=query_truck_type
   SELECT abbreviate_words(typeoftruck) typeoftruck FROM trucks WHERE id=$1
-- id=insert_cp_queue_assignments
   INSERT INTO cp_queue_assignments(cp_queue_id,lane_id,truck_id,created_by,created_at,entrance_time,auditupdate)
   VALUES($1,$2,$3,$4,now(),now(),now())    
-- id=query_check_truck_id_still_in_cp_queue_assignments
   SELECT EXISTS(1) isexist FROM cp_queue_assignments 
   WHERE truck_id=$1 AND status!='COMPLETED'
-- id=query_update_cp_queue_assignment_cp_to_outside;
   UPDATE cp_queue_assignments   

-- id=summary_cp_queue_filter_by_lane_id_changes
    SELECT json_build_object(
        'last_updated',
            (select auditupdate from logs.last_job_executed lje where job_name='job-monitor-simpang-bayah' ),
        'sum_queue_in_cp',
            (SELECT COUNT(1)
        FROM cp_queue_assignments cqa INNER JOIN queue_lane l 
        ON cqa.lane_id=l.id INNER JOIN
        trucks t ON cqa.truck_id=t.id   
        ::search
        WHERE cqa.exit_time IS NULL
        AND cqa.status = 'WAITING'
        AND l.status = ANY($1)
        AND cqa.lane_id IS NOT NULL
        AND cqa.lane_id = ANY($2)
        )
        ,
        'lane_info',
            (
                SELECT jsonb_agg(a)
                FROM (
                    SELECT
                        l.id,
                        l.lane_name,
                        l.max_capacity,
                        l.positioning,
                        (
                            SELECT array_agg(abbreviate_words(t.typeoftruck))
                            FROM (
                                SELECT t.typeoftruck
                                FROM cp_queue_assignments cqa
                                INNER JOIN trucks t ON cqa.truck_id = t.id
                                WHERE cqa.lane_id = l.id
                                AND cqa.exit_time IS NULL
                                AND cqa.status = 'WAITING'
                                AND cqa.lane_id IS NOT NULL
                                AND cqa.lane_id = ANY($2)
                                ::search
                                GROUP BY t.typeoftruck
                    --            #ADDITIONAL
                            ) t group by abbreviate_words(t.typeoftruck)
                        ) AS listoftrucktype,
                        l.status,
                       /* CONCAT(
                            COALESCE(
                                (SELECT COUNT(1)
                                FROM cp_queue_assignments cqa INNER JOIN trucks t
                                ON cqa.truck_id=t.id  AND t.nomor_lambung ilike $2
                                WHERE cqa.cp_queue_id = l.id
                                AND cqa.truck_id=t.id
                                AND cqa.exit_time is NULL
                                AND cqa.status = 'WAITING'
                                AND cqa.lane_id IS NOT NULL

                                ),
                                0
                            ),
                            '/',
                            l.max_capacity
                        ) AS sumoftruck,*/
                        COALESCE(
                            (
                                SELECT jsonb_agg(jsonb_build_object(
                                    'assignment_id', cqa.assignment_id,
                                    'truck_id', cqa.truck_id,
                                    'nomor_lambung', t.nomor_lambung,
                                    'driver',cqa.driver_name
                                ))
                                FROM cp_queue_assignments cqa
                                INNER JOIN trucks t ON cqa.truck_id = t.id
                                ::search
                                WHERE cqa.lane_id = l.id
                                AND cqa.exit_time IS NULL
                                AND cqa.status = 'WAITING'
                                AND cqa.lane_id IS NOT NULL
                                AND cqa.lane_id = ANY($2)

                            ),
                            '[]'
                        ) AS truck_info
                    FROM queue_lane l  where l.status = ANY($1) 
                    AND cqa.lane_id = ANY($2)
                    ORDER BY l.positioning ASC
                ) a
            )
        ) result;
    
-- id=summary_cp_dashboard_by_cp_id_changes
    SELECT json_build_object(
    'last_updated',
        (select auditupdate from logs.last_job_executed lje where job_name='job-monitor-cp' ),
    'total_trucks_in_cp',
        (SELECT COUNT(1)
    FROM cp_queue_assignments cqa INNER JOIN cps 
    ON cqa.cp_queue_id=cps.cp_id INNER JOIN 
    trucks t ON cqa.truck_id=t.id  
	--::search
    WHERE cqa.cp_queue_id=cps.cp_id AND
    cqa.truck_id=t.id
    AND cqa.exit_time IS NOT NULL 
    AND cqa.status != 'COMPLETED'
    --AND cps.status = ANY($1)
    AND cqa.cp_queue_id IS NOT NULL
    AND cqa.cp_queue_id=ANY($1)
    
    )
    ,
    'cp_info',
        (
            SELECT jsonb_agg(a)
            FROM (
                SELECT 
                    cps.cp_id, 
                    cps.cp_name, 
                    cps.max_capacity,
                    cps.positioning,
                    (
                        SELECT array_agg(abbreviate_words(t.typeoftruck))
                        FROM (
                            SELECT t.typeoftruck
                            FROM cp_queue_assignments cqa 
                            INNER JOIN trucks t ON cqa.truck_id = t.id
                            WHERE cqa.cp_queue_id = cps.cp_id 
                            AND cqa.exit_time IS NOT NULL 
                            AND cqa.status != 'COMPLETED'
                            AND cqa.cp_queue_id=ANY($1)
 
                            --::search
                            GROUP BY t.typeoftruck 
                        ) t group by abbreviate_words(t.typeoftruck)
                    ) AS listoftrucktype,
                    COALESCE(
                        (
                            SELECT 
                                jsonb_agg(
                                    jsonb_build_object(
                                        'max_capacity', rlc.max_capacity,
                                        'truck_type',rlc.truck_type
                                    )
                                )
                            FROM 
                                rule_of_cp rlc
                            WHERE rlc.cp_id = cps.cp_id
                        ), 
                        '[]'
                    ) AS rule_cps,
                    cps.status,
                    CONCAT(
                        COALESCE(
                            (SELECT COUNT(1)
                            FROM cp_queue_assignments cqa INNER JOIN trucks t 
                            ON cqa.truck_id=t.id 
						--	::search
                            WHERE cqa.cp_queue_id = cps.cp_id 
                            AND cqa.truck_id=t.id 
                            AND cqa.status != 'COMPLETED'
                            AND cqa.cp_queue_id=ANY($1)
                             ), 
                            0
                        ), 
                        '/', 
                        cps.max_capacity
                    ) AS sum_truck_in_cp,
                    COALESCE(
                        (
                            SELECT 
                                jsonb_agg(
                                    jsonb_build_object(
                                        'assignment_id', cqa.assignment_id,
                                        'truck_id', cqa.truck_id,
                                        'nomor_lambung', cqa.nomor_lambung,
                                        'driver', cqa.driver_name
                                    )
                                )
                            FROM 
                                cp_queue_assignments cqa
                            INNER JOIN 
                                trucks t ON cqa.truck_id = t.id
                            --::search
                            WHERE 
                                cqa.cp_queue_id = cps.cp_id 
                                AND cqa.exit_time IS NOT NULL 
                                AND cqa.status != 'COMPLETED'
                                AND cqa.cp_queue_id IS NOT NULL
                                AND cqa.cp_queue_id=ANY($1)
 
                           
                        ), 
                        '[]'
                    ) AS truck_info
                FROM cps 
                where cps.cp_id = ANY($1)
                ORDER BY cps.positioning ASC
            ) a
        )
    ) result;  
  
   
  
-- id=query_queue_lane
   select id,lane_name,max_capacity from queue_lane ql WHERE status is true

-- id=query_logs_trucks
   SELECT 
    truck_id, 
    t.nomor_lambung,
    case when thc.status='online' then 'STARTED' else thc.status end status, 
    thc.description, 
    thc.created_at
    FROM 
        logs.truck_history_cp thc inner join trucks t on thc.truck_id=t.id
    WHERE 
        thc.created_at = (
            SELECT MIN(a.created_at) 
            FROM logs.truck_history_cp a
            WHERE a.truck_id = thc.truck_id 
            AND a.status = thc.status 
            AND a.description = thc.description
        )
      ::search
       ORDER BY 
        thc.truck_id,thc.created_at ASC;

         
-- id=lane_max_capacity
    select max_capacity  from queue_lane l where l.id = $1
-- id=current_load_lane
    SELECT count(*) FROM cp_queue_assignments
    WHERE lane_id = $1 AND exit_time IS NULL AND cp_queue_id IS NULL AND DATE(created_at) = CURRENT_DATE
-- id=query_exit_cp
    with cteofCpQAssigment as (
        SELECT assignment_id from cp_queue_assignments 
        WHERE truck_id in (select id from trucks t WHERE t.nomor_lambung=$1 and t.id=truck_id) 
        AND status!='COMPLETED'   
    )    
    UPDATE cp_queue_assignments a SET status='COMPLETED',completed_by='GEOFENCE', exit_cp_time=now(),auditupdate=now()  
    WHERE a.assignment_id in (select assignment_id from cteofCpQAssigment) ;

-- id=query_exit_by_assigment_id
    UPDATE cp_queue_assignments a SET status='COMPLETED',exit_cp_time=now(),auditupdate=now()
    ,updated_by =$1,completed_by=(getnameofusers($1))
    WHERE a.assignment_id=$2
-- id=query_summary_lane_changes_by_id
    SELECT json_build_object(
    'last_updated',
        (SELECT auditupdate 
         FROM logs.last_job_executed lje 
         WHERE job_name='job-monitor-simpang-bayah' 
         LIMIT 1),
    'sum_queue_in_cp',
        (SELECT COUNT(1)
         FROM cp_queue_assignments cqa 
         INNER JOIN queue_lane l ON cqa.lane_id = l.id
         INNER JOIN trucks t ON cqa.truck_id = t.id
         WHERE cqa.exit_time IS NULL
         AND cqa.status = 'WAITING'
         AND cqa.lane_id = ANY($1)
         ),
    'lane_info',
        (
            SELECT jsonb_agg(a)
            FROM (
                SELECT
                    l.id,
                    l.lane_name,
                    l.max_capacity,
                    l.positioning,
                    (
                        SELECT array_agg(DISTINCT abbreviate_words(t.typeoftruck))  -- Add DISTINCT to avoid duplicates
                        FROM (
                            SELECT t.typeoftruck
                            FROM cp_queue_assignments cqa
                            INNER JOIN trucks t ON cqa.truck_id = t.id
                            WHERE cqa.lane_id = l.id
                            AND cqa.exit_time IS NULL
                            AND cqa.status = 'WAITING'
                            AND cqa.lane_id = ANY($1) 
                            GROUP BY t.typeoftruck
                        ) t 
                    ) AS listoftrucktype,
                    l.status,
                    COALESCE(
                        (
                            SELECT jsonb_agg(jsonb_build_object(
                                'assignment_id', cqa.assignment_id,
                                'truck_id', cqa.truck_id,
                                'nomor_lambung', cqa.nomor_lambung,
                                'driver', cqa.driver_name
                            ))
                            FROM cp_queue_assignments cqa
                            INNER JOIN trucks t ON cqa.truck_id = t.id
                            WHERE cqa.lane_id = l.id
                            AND cqa.exit_time IS NULL
                            AND cqa.status = 'WAITING'
                            AND cqa.lane_id = ANY($1)
                        ),
                        '[]'
                    ) AS truck_info
                FROM queue_lane l 
                WHERE 
                l.id = ANY($1)
                ORDER BY l.positioning ASC
            ) a
        )
) result;


-- id=save_log_cp_queue_assigment
   INSERT INTO (assignment_id,created_at)
   VALUES($1,NOW()) ON CONFLICT(assignment_id ) DO NOTHING
-- id=insert_trucks_urgent
   INSERT INTO trucks (id, nomor_lambung, typeoftruck, capacity_in_tons, status, auditupdate)
   VALUES ($1, $2, $3, 0, TRUE, NOW()) ON CONFLICT(id) DO NOTHING
-- id=query_check_truck_id
   select exists (select 1 from trucks where id=$1) isexist

-- id=query_check_device_at_simpang_bayah
   SELECT COUNT(1) as z_count FROM  device_at_simpang_bayah WHERE  status='IN-SB' 
   and lane_id=$1

-- id=query_rule_in_simpang_bayah
   SELECT EXISTS(SELECT 1 FROM rulesofsimpang_bayah WHERE lane_id=$1 AND truck_type=$2) isexist
 
-- id=add_truck_queue_with_kafka
   UPDATE  cp_queue_assignments SET status='WAITING',entrance_time=now(), auditupdate=now(), 
   assigned_by='GEOFENCE'      
   WHERE status='IN-SB' AND truck_id=$1;  
-- id=update_cp_queue_assignment_status_to_complate
   UPDATE  cp_queue_assignments SET status='COMPLETED',exit_cp_time=now(), auditupdate=now(),
   completed_by='GEOFENCE'      
   WHERE ((status!='COMPLETED') AND truck_id=$1);     

-- id=update_device_at_simpang_bayah_status_to_exit_cp
   UPDATE  device_at_simpang_bayah SET device_status='EXIT-CP',exit_cp_time=now(), auditupdate=now()     
   WHERE ((device_status='IN-SB' OR device_status='EXIT-SB') AND truck_id=$1);     
-- id=query_check_truck_by_name
   select exists (select 1 from trucks where nomor_lambung=$1) isexist
-- id=query_update_simpang_bayah_to_exit_sb
   UPDATE device_at_simpang_bayah SET device_status='EXIT-SB' WHERE 
   truck_id=$1 AND device_status='IN-SB'
-- id=video_tron_notif_simpang_bayah
   WITH RankedQueue AS (
          SELECT 
              qv.*,
              l.id AS lane_number,
              ROW_NUMBER() OVER (
                  PARTITION BY l.id 
                  ORDER BY 
                      CASE 
                          WHEN qv.nomorlambung = 'STATIC' THEN 1 
                          ELSE 0 
                      END DESC,  -- Prioritaskan STATIC terlebih dahulu
                      qv.id DESC -- Untuk STATIC, ambil yang terakhir berdasarkan ID
              ) AS rn
          FROM 
              lanes l
          LEFT JOIN 
              queue_vidiotron qv ON l.id = qv.lane_id
          LEFT JOIN 
              vidiotron_lane vl ON l.id = vl.lane_id
          LEFT JOIN 
              vidiotron v ON vl.vidiotron_id = v.id
          WHERE 
              (
                  v.is_dynamic = FALSE AND qv.nomorlambung = 'STATIC' AND qv.flag = 1  -- Jika is_dynamic = false, ambil STATIC
              )
              OR (
                  v.is_dynamic = TRUE AND (qv.nomorlambung != 'STATIC' AND (qv.flag = 0 OR qv.flag IS NULL))  -- Jika is_dynamic = true, ambil dinamis
              )
      ),
      FinalResult AS (
          SELECT 
              l.id AS id,
              l.lane_name AS lane_name,
              l.lane_code AS lane_code,
              l.status AS lane_status,
              rq.vidiotron_notif_id,
              rq.nomorlambung,
              rq.flag,
              rq.lane_number
          FROM 
              lanes l
          LEFT JOIN 
              RankedQueue rq ON l.id = rq.lane_number AND rq.rn = 1
          LEFT JOIN 
              vidiotron_notif vn ON rq.vidiotron_notif_id = vn.vidiotron_notif_id
      )
      SELECT 
          FinalResult.id as lane_id_sb,
          FinalResult.lane_name,
          FinalResult.lane_code,
          FinalResult.lane_status,
          FinalResult.vidiotron_notif_id,
          FinalResult.nomorlambung,
          FinalResult.flag,
          FinalResult.lane_number,
          vn.*
      FROM 
          FinalResult
      LEFT JOIN 
          vidiotron_notif vn ON FinalResult.vidiotron_notif_id = vn.vidiotron_notif_id
      WHERE FinalResult.id IN (SELECT id from logs.detect_lane_simpang_bayah)    
      ORDER BY 
          FinalResult.lane_name
        
-- id=insert_logs_detect_simpang_bayah
       INSERT INTO logs.detect_lane_simpang_bayah(id,created_at)
       VALUES($1,NOW()) 
       ON CONFLICT(id) DO UPDATE SET created_at=EXCLUDED.created_at 


----Parsing Query summary_cp_dashboard_by_cp_id_changes
-- id=summary_last_date_changes
   select auditupdate from logs.last_job_executed lje where job_name=$1
-- id=total_trucks_in_cp_changes
    SELECT COUNT(1) sumoftotaltruck  
    FROM cp_queue_assignments cqa INNER JOIN cps 
    ON cqa.cp_queue_id=cps.cp_id INNER JOIN 
    trucks t ON cqa.truck_id=t.id  
    --::search
    WHERE 
    cqa.truck_id=t.id
    AND cqa.exit_time IS NOT NULL 
    AND cqa.status != 'COMPLETED'
    --AND cps.status = ANY($1)
    AND cqa.cp_queue_id IS NOT NULL
    AND cqa.cp_queue_id=ANY($1)
-- id=cp_info_master
        SELECT 
            cps.cp_id, 
            cps.cp_name, 
            cps.max_capacity,
            cps.positioning,
            cps.status 
        FROM cps 
                where cps.cp_id = ANY($1)
                ORDER BY cps.positioning ASC

-- id=truck_info_in_cp
        SELECT 
            jsonb_agg(
                jsonb_build_object(
                    'assignment_id', cqa.assignment_id,
                    'truck_id', cqa.truck_id,
                    'nomor_lambung', cqa.nomor_lambung,
                    'driver', cqa.driver_name
                )
            ) info_truck_in_cp,
            cqa.cp_queue_id
        FROM 
            cp_queue_assignments cqa
        INNER JOIN 
            trucks t ON cqa.truck_id = t.id
        --::search
        WHERE 
            cqa.exit_time IS NOT NULL 
            AND cqa.status != 'COMPLETED'
            AND cqa.cp_queue_id IS NOT NULL
            AND cqa.cp_queue_id=ANY($1)
       GROUP BY cqa.cp_queue_id                 

-- id=sum_truck_in_cp
        SELECT COUNT(1) sumoftruck,
        cqa.cp_queue_id

        FROM cp_queue_assignments cqa INNER JOIN trucks t 
        ON cqa.truck_id=t.id  
    --	::search
        WHERE 
        cqa.truck_id=t.id 
        AND cqa.status != 'COMPLETED'
        AND cqa.cp_queue_id=ANY($1)
        GROUP BY cqa.cp_queue_id
 -- id=listoftrucktypeInCP
    SELECT to_json(string_to_array(allow_unit,',')) truck_type,
    cp_id as cp_queue_id   
    FROM cps c
    WHERE  c.cp_id=ANY($1)
    GROUP by c.cp_id 
-- id=ruleofcps_changes
    SELECT 
        jsonb_agg(
            jsonb_build_object(
                'max_capacity', rlc.max_capacity,
                'truck_type',rlc.truck_type
            )
        ) ruleofcp,
        cp_id
    FROM 
        rule_of_cp rlc
    WHERE rlc.cp_id = ANY($1) 
    GROUP BY cp_id

-- Parsing Query in Lanes
  -- id=sum_queue_in_cp
        SELECT COUNT(1)
         FROM cp_queue_assignments cqa 
         INNER JOIN queue_lane l ON cqa.lane_id = l.id
         INNER JOIN trucks t ON cqa.truck_id = t.id
         WHERE cqa.exit_time IS NULL
         AND cqa.status = 'WAITING'
         AND cqa.lane_id = ANY($1)
  -- id=master_lane_changes
        SELECT
        l.id,
        l.lane_name,
        l.max_capacity,
        l.positioning,
        FROM queue_lane l 
        WHERE 
        l.id = ANY($1)
        ORDER BY l.positioning ASC
-- id=TypeofTruck_lane_changes
        SELECT array_agg(DISTINCT abbreviate_words(t.typeoftruck)), 
        t.lane_id   -- Add DISTINCT to avoid duplicates
        FROM (
            SELECT t.typeoftruck,cqa.lane_id
            FROM cp_queue_assignments cqa
            INNER JOIN trucks t ON cqa.truck_id = t.id
            WHERE cqa.lane_id = l.id
            AND cqa.exit_time IS NULL
            AND cqa.status = 'WAITING'
            AND cqa.lane_id = ANY($1) 
            GROUP BY t.typeoftruck, cqa.lane_id
        ) t 


-- id=update_cp_queue_assignment_in_cp
    with cteofCpQAssigment as (
        SELECT assignment_id from cp_queue_assignments 
        WHERE truck_id = $2
        AND status!='COMPLETED' ORDER BY  auditupdate desc LIMIT 1   
    )    
    UPDATE cp_queue_assignments a SET cp_queue_id=$1,assigned_by='GEOFENCE',
    auditupdate=now(), status='ASSIGNED_TO_CP'  
    WHERE a.assignment_id = (select assignment_id from cteofCpQAssigment) ;
-- id=insert_cp_queue_assignment_in_cp
   INSERT INTO cp_queue_assignments (truck_id,cp_queue_id,truck_type,nomor_lambung,
   status,assigned_by,audit_update,created_at) 
   VALUES($1,$2,$2,$3,$4,$5,$6,$7)

-- id=get_info_cp_queue_assignments_before_update
    SELECT row_to_json(a.*) prev_data 
    from 
    (SELECT 
    CASE WHEN  a.cp_queue_id IS NOT NULL THEN
    (SELECT cp_name FROM cps c WHERE c.cp_id=a.cp_queue_id)
    ELSE 
    ''
    end cp_name,
    CASE WHEN  a.lane_id IS NOT NULL THEN
    (SELECT lane_name FROM queue_lane c WHERE c.id=a.lane_id)
    ELSE 
    ''
    end lane_name,
    CASE WHEN (a.updated_by IS NOT NULL AND a.status='ASSIGNED_TO_CP') THEN 
        (SELECT name FROM users WHERE id=a.updated_by)    
    WHEN (a.created_by IS NOT NULL AND (a.status='WAITING' OR a.status='IN-SB')) THEN
        (SELECT name FROM users WHERE id=a.created_by)
    ELSE
        a.assigned_by
    END assigned_by     
    FROM cp_queue_assignments a   
    WHERE 
    a.truck_id=$1 
    AND 
    a.status!='COMPLETED'
    )a

-- id=is_exist_changes
    SELECT EXISTS (select 1 from logs.cp_queuement_changes cqc
    UNION 
    select 1 from logs.cpqa_last_completed clc 
    UNION 
    select 1 from logs.detect_cps_changes dcc 
    UNION 
    select 1 from logs.detect_lane_changes dlc 
    UNION 
    select 1 from logs.detect_lane_simpang_bayah 
    ) isexist


-- id=count_truck_from_geofence_kafka
    WITH recent_data AS (
        SELECT
            id,
            total_muatan,
            total_kosongan,
            created_at,
            jsonb_array_elements(groups::jsonb) AS group_data,
            ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at DESC) AS rn
        FROM kafka_dt_truck_count_location
        WHERE created_at >= NOW() - INTERVAL '1 minutes'  -- Get data from the last 1 minutes
    ),
    truck_data AS (
        SELECT
            group_data->>'group' AS geofence_group,
            jsonb_array_elements(group_data->'dataMuatan')->>'name' AS muatan_truck_name,   -- Extract muatan trucks
            jsonb_array_elements(group_data->'dataKosongan')->>'name' AS kosongan_truck_name  -- Extract kosongan trucks
        FROM recent_data
        WHERE rn = 1  -- Keep only the latest record per id
    )
    SELECT
        geofence_group,
        COUNT(DISTINCT muatan_truck_name) + COUNT(DISTINCT kosongan_truck_name) as total_truck,
        COUNT(DISTINCT muatan_truck_name) AS total_muatan_trucks,  -- Unique loaded trucks
        COUNT(DISTINCT kosongan_truck_name) AS total_kosongan_trucks -- Unique empty trucks
    --    STRING_AGG(DISTINCT kosongan_truck_name, ', ') AS kosongan_truck_names,  -- List empty trucks
    --    STRING_AGG(DISTINCT muatan_truck_name, ', ') AS muatan_truck_names  -- List loaded trucks
    FROM truck_data
    GROUP BY geofence_group;