CREATE TABLE cp_devices (
    id SERIAL PRIMARY KEY,
    cp_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(100),
    auditupdate TIMESTAMP DEFAULT NOW(),
    updated_by VARCHAR(100),
    CONSTRAINT fk_cp_id FOREIGN KEY (cp_id) REFERENCES cps (cp_id) ON DELETE CASCADE
);

CREATE TABLE cp_units (
    id SERIAL PRIMARY KEY,
    cp_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(100),
    auditupdate TIMESTAMP DEFAULT NOW(),
    updated_by VARCHAR(100),
    CONSTRAINT fk_cp_id FOREIGN KEY (cp_id) REFERENCES cps (cp_id) ON DELETE CASCADE
);