CREATE TABLE queue_lane (
    id SERIAL PRIMARY KEY,
    lane_name VARCHAR(100) NOT NULL,
    positioning INT NULL,
    max_capacity INT NULL,
    status BOOLEAN DEFAULT FALSE,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INT,
    audit_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE queue_lane_rules (
    id SERIAL PRIMARY KEY,
    queue_lane_id INT NOT NULL,
    max_capacity INT NULL,
    truck_type VARCHAR(50) NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INT,
    audit_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_queue_lane FOREIGN KEY (queue_lane_id) REFERENCES queue_lane(id) ON DELETE CASCADE
);

CREATE TABLE rule_of_cp (
    id SERIAL PRIMARY KEY,
    cp_id INT NOT NULL,
    max_capacity INT NULL,
    truck_type VARCHAR(255) NULL,
    created_by INT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by INT NULL,
    auditupdate TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
