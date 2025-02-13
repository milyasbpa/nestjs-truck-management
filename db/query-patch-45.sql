CREATE INDEX idx_rfid_reader_out_id ON rfid_reader_out (rfid_reader_out_id);
CREATE INDEX idx_rfid_reader_out_created_at ON rfid_reader_out (created_at);
CREATE INDEX idx_rfid_reader_in_created_date ON rfid_reader_in (to_date_immutable(created_at));
CREATE INDEX idx_rfid_reader_out_created_date ON rfid_reader_out (to_date_immutable(created_at));
ALTER TABLE queue_lane                             
ADD COLUMN geofence_kode VARCHAR(120) DEFAULT NULL;

CREATE TABLE IF NOT EXISTS "queue_vidiotron_cp" (
	"id" SERIAL PRIMARY KEY,
	"lane_id" INTEGER NOT NULL,
	"vidiotron_notif_id" INTEGER NOT NULL,
	"cp_id" INTEGER NULL DEFAULT NULL,
	"nomorlambung" VARCHAR(255) NOT NULL,
	"created_at" TIMESTAMP NULL DEFAULT NULL,
	"auditupdate" TIMESTAMP NULL DEFAULT NULL,
	"flag" INTEGER NULL DEFAULT '0',
	"lane_name" VARCHAR(255) NULL DEFAULT NULL,
	"queue_lane_id" INTEGER NULL DEFAULT NULL,
	"queue_lane_name" VARCHAR(120) NULL DEFAULT NULL,
);
