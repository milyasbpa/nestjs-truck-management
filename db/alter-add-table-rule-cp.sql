CREATE TABLE rule_lane_cp (
    id SERIAL PRIMARY KEY,
    queue_lane_id INT NOT NULL,
    name_queue_lane VARCHAR(255) NOT NULL
);

INSERT INTO queue_lane (lane_name, positioning, max_capacity, status)
VALUES
('LANE 1', 1, 10, true),
('LANE 2', 2, 10, true),
('LANE 3', 3, 10, true),
('LANE 4', 4, 10, true)

INSERT INTO rule_lane_cp (id, queue_lane_id, name_queue_lane)
VALUES
(6, 1, 'LANE 1'),
(7, 1, 'LANE 1'),
(1, 2, 'LANE 2'),
(3, 2, 'LANE 2'),
(11, 2, 'LANE 2'),
(10, 2, 'LANE 2'),
(4, 3, 'LANE 3'),
(5, 3, 'LANE 3'),
(9, 4, 'LANE 4'),
(8, 4, 'LANE 4');

ALTER TABLE rule_lane_cp
ADD COLUMN created_by INT NULL,
ADD COLUMN updated_by INT NULL,
ADD COLUMN created_at TIMESTAMP NULL,
ADD COLUMN auditupdate TIMESTAMP NULL;
