CREATE TABLE IF NOT EXISTS queue_vidiotron_logs (
    id SERIAL PRIMARY KEY,
    vidiotron_notif_id INT NOT NULL,
    nomorlambung VARCHAR(50) NOT NULL,
    lane_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO cron_schedule (cron_name, schedule) 
SELECT 'ApiRemoveQueueVidiotron', '0 */6 * * *'
WHERE NOT EXISTS (
    SELECT 1 FROM cron_schedule WHERE cron_name = 'ApiRemoveQueueVidiotron'
);

INSERT INTO cron_schedule (cron_name, schedule) 
SELECT 'ApiCheckActualGeofenceTruckSbayah', '*/3 * * * *'
WHERE NOT EXISTS (
    SELECT 1 FROM cron_schedule WHERE cron_name = 'ApiCheckActualGeofenceTruckSbayah';
);
