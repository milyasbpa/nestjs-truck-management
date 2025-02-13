CREATE TABLE cp_queue_assignments_logs (
    id SERIAL PRIMARY KEY,
    assignments_id INTEGER NOT NULL,
    truck_id INTEGER NOT NULL, 
    nomorlambung VARCHAR(50),
    flag VARCHAR(20),
    entrance_by VARCHAR(50),
    exit_by VARCHAR(50),
    cp_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    auditupdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);
