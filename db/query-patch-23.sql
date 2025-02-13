CREATE TABLE cp_status_log (
    id SERIAL PRIMARY KEY,
    cp_id INT NOT NULL,
    status BOOLEAN NOT NULL,
    reason TEXT,
    auditupdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(20) NOT NULL
);
