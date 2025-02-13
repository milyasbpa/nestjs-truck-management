CREATE TABLE cp_device_log (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255) NOT NULL,
    item_name VARCHAR(255),
    item_id VARCHAR(255),
    status INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    auditupdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE cps
ADD COLUMN priority_update_status VARCHAR(20) NOT NULL DEFAULT 'API';
