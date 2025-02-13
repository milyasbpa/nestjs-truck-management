alter table cp_queue_assignments add column driver_name varchar(255) null;
ALTER TABLE cp_queue_assignments OWNER TO dev_rppj;

-- DROP FUNCTION public.validate_lane_capacity();

CREATE OR REPLACE FUNCTION public.validate_lane_capacity()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    _total_lane INTEGER;
    _max_capacity INTEGER;
    _truck_type TEXT;
    _bb text;
BEGIN
    -- Dapatkan tipe truk dari tabel trucks
    SELECT abbreviate_words(typeoftruck)
    INTO _truck_type
    FROM trucks
    WHERE id = NEW.truck_id;

    RAISE NOTICE 'Truck Type: %', _truck_type;

    -- Validasi lane baru
    if TG_OP='INSERT'  then
    BEGIN
	    IF NEW.lane_id IS NOT NULL THEN
	        SELECT COUNT(*)::numeric
	        INTO _total_lane
	        FROM cp_queue_assignments a
	        JOIN trucks b ON a.truck_id = b.id
	        WHERE a.lane_id = NEW.lane_id 
	          AND a.exit_time IS NULL 
              AND a.status='WAITING' 
	          AND abbreviate_words(b.typeoftruck) =_truck_type;
			
	         SELECT abbreviate_words(b.typeoftruck) 
	        INTO _bb
	        FROM cp_queue_assignments a
	        JOIN trucks b ON a.truck_id = b.id
	        WHERE a.lane_id = NEW.lane_id 
	          AND a.exit_time IS NULL 
              AND a.status='WAITING' 
	          AND abbreviate_words(b.typeoftruck) =_truck_type;
	
	         
	        select coalesce(sum(rb.max_capacity)::numeric,0) into _max_capacity from queue_lane_rules rb
	        where  queue_lane_id = NEW.lane_id AND truck_type = _truck_type
	        group by 
			rb.queue_lane_id,rb.truck_type;
		
			  RAISE NOTICE 'total_lane % - % - % ', _total_lane,_max_capacity, _bb;
	        IF _total_lane >= _max_capacity THEN
	            RAISE EXCEPTION 'Lane capacity exceeded for new lane_id: %, truck_type: %', NEW.lane_id, _truck_type;
	        END IF;
	    END IF;
	end;
	end if;

    if TG_OP='UPDATE'  then
    begin
	    raise notice 'OLD.lane,%,NEW.lanes:%,NEW.cp_queue_id %',OLD.lane_id,NEW.lane_id ,new.cp_queue_id;
	   
	    -- Validasi lane lama (hanya jika lane_id berubah)
	    IF OLD.lane_id IS NOT NULL AND NEW.lane_id IS DISTINCT FROM OLD.lane_id and new.cp_queue_id is NULL THEN
	        SELECT COUNT(*)::numeric
	        INTO _total_lane
	        FROM cp_queue_assignments a
	        JOIN trucks b ON a.truck_id = b.id
	        WHERE a.lane_id = OLD.lane_id 
	          AND a.exit_time IS NULL 
              AND a.status='WAITING'
	          AND abbreviate_words(b.typeoftruck) = _truck_type;
	
	        select coalesce(sum(rb.max_capacity),0)::numeric into _max_capacity from queue_lane_rules rb
	        where  queue_lane_id = NEW.lane_id AND truck_type = _truck_type
	        group by 
			rb.queue_lane_id,rb.truck_type;
		
	        IF _total_lane >= _max_capacity THEN
	            RAISE EXCEPTION 'Lane capacity exceeded for old lane_id: %, truck_type: %', OLD.lane_id, _truck_type;
	        END IF;
	    END IF;
	   
	end;
  end if;

    RETURN NEW;
END;
$function$
;