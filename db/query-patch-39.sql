CREATE TABLE vidiotron_config_lane (
    id SERIAL PRIMARY KEY,
    vidiotron_id INT NOT NULL,
    queue_lane_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    auditupdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE vidiotron
ADD COLUMN max_value INTEGER DEFAULT 1;