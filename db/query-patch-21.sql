CREATE OR REPLACE VIEW public.mv_simpang_bayah 
as 
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
    