CREATE INDEX idx_queue_lane_rules_queue_lane_id
ON queue_lane_rules (queue_lane_id);

CREATE INDEX idx_last_truck_movement_geofence
ON last_truck_movement (geofence);

CREATE INDEX idx_nomorlambung_on_queue_vidiotron
ON  queue_vidiotron(nomorlambung);

CREATE INDEX idx_notif_type_on_videotron_notif ON vidiotron_notif(notif_type);

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_users_name_email_username_gin
ON users USING gin (
  lower(name) gin_trgm_ops ,
  lower(email) gin_trgm_ops,
 lower(username) gin_trgm_ops
);
