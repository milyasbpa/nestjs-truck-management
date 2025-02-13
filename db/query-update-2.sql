CREATE TABLE geofence_service_logs (
    id SERIAL PRIMARY KEY,
    truck_id INT,
    geofence VARCHAR(255),
    nomor_lambung VARCHAR(255),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255)
);