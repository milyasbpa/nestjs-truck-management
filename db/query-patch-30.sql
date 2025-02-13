CREATE TABLE IF NOT EXISTS "cp_tonages_log" (
    "id" SERIAL PRIMARY KEY,
    "device_id" VARCHAR(255) NOT NULL,
    "device_name" VARCHAR(255) NOT NULL,
    "item_name" VARCHAR(255) DEFAULT NULL,
    "item_id" VARCHAR(255) DEFAULT NULL,
    "value" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "auditupdate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_by" VARCHAR(20) DEFAULT 'USCAVIS',
    "connection" BOOLEAN DEFAULT true
);

INSERT INTO cp_tonages (cp_id, uid, name, item_name, item_id)
VALUES
    (6, 'sKp3RjYB', 'OMS+_S7-1500_BunatiCPPStockpile&Port (1)', 'HMI_Data_BW101_Val', '0aYdeR07'),
    (7, 'cHZ7GJig', 'OMS+_S7-1500_BunatiCPP07', 'Flowrate Belt Scale CV 109', 'ua4srhy3'),
    (8, 'MQU82viu', 'opcua_8', 'CP8.AI.BELT_SCALE_FLOWRATE', 'c8Vs0wq5'),
    (1, '6169FO1W', 'OMS+_CPU', 'CV22_FLOWRATE', 'bS3sGZS4');

INSERT INTO cron_schedule (cron_name,schedule) VALUES ('ApiCheckTonagesCp','*/1 * * * * *');

CREATE OR REPLACE FUNCTION notify_queue_assignment_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Kirim notifikasi ke channel PostgreSQL
    PERFORM pg_notify('table_changes', json_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP,
    'id', 
    CASE 
	WHEN TG_OP = 'DELETE' THEN OLD.assignment_id 
	WHEN TG_OP = 'UPDATE' THEN OLD.assignment_id
	ELSE 
    NEW.assignment_id END
	)::text);

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE or replace TRIGGER cp_queue_assignments_trigger_changes
AFTER INSERT OR UPDATE OR DELETE ON cp_queue_assignments
FOR EACH ROW EXECUTE FUNCTION notify_queue_assignment_changes();


CREATE TABLE logs.detect_cps_changes (
	id int8 NOT NULL,
	created_at timestamptz NULL,
	CONSTRAINT detect_cps_changes_pkey PRIMARY KEY (id)
);      

CREATE OR REPLACE FUNCTION logs.flog_detect_cps_changes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    if NEW.cp_id IS NOT NULL THEN
		INSERT INTO logs.detect_cps_changes (id, created_at)
	    VALUES (NEW.cp_id, NOW())
	    ON CONFLICT (id) DO UPDATE
	    SET created_at = EXCLUDED.created_at;
	END IF;
    if OLD.cp_id IS NOT NULL THEN
		INSERT INTO logs.detect_cps_changes (id, created_at)
	    VALUES (OLD.cp_id, NOW())
	    ON CONFLICT (id) DO UPDATE
	    SET created_at = EXCLUDED.created_at;
	END IF;

	RETURN NEW;
END;
$function$
;


create trigger after_cps_change after
insert
    or
update or
delete 
    on
    public.cps for each row execute function logs.flog_detect_cps_changes();

create or replace trigger after_queue_lane_change after
insert
    or
update or delete
    on
    public.queue_lane for each row execute 
    function logs.flog_detect_lane_changes();
    
CREATE OR REPLACE FUNCTION logs.flog_detect_queue_lane_rules_changes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO logs.detect_lanes_changes (id, created_at)
    VALUES (NEW.queue_lane_id, NOW())
    ON CONFLICT (id) DO UPDATE
    SET created_at = EXCLUDED.created_at;
    RETURN NEW;
END;
$function$
;

create or replace trigger after_queue_lane_rules_change after
insert
    or
update or delete
    on
    public.queue_lane_rules  for each row execute 
    function logs.flog_detect_queue_lane_rules_changes();
