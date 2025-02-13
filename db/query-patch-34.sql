DROP TABLE IF EXISTS queue_vidiotron;

CREATE TABLE queue_vidiotron (
id SERIAL PRIMARY KEY,
    lane_id INTEGER NOT NULL,
    vidiotron_notif_id INTEGER NOT NULL,
    nomorlambung VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    auditupdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    flag INTEGER DEFAULT 0,
    lane_name VARCHAR(255) NULL
);
