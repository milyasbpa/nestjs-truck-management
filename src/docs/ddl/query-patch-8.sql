alter table rulesofsimpang_bayah add column max_capacity numeric default 3;

select count(1) max_capacity,lane_id,truck_type from rulesofsimpang_bayah where lane_id=1  group by lane_id,truck_type;

CREATE OR REPLACE FUNCTION abbreviate_words(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    word TEXT;
BEGIN--select * from rulesofsimpang_bayah rb 
select sum(rb.max_capacity)from rulesofsimpang_bayah rb group by 
rb.lane_id,rb.truck_type;

CREATE OR REPLACE FUNCTION validate_lane_capacity()
RETURNS TRIGGER AS $$
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
    IF NEW.lane_id IS NOT NULL THEN
        SELECT COUNT(*)::numeric
        INTO _total_lane
        FROM cp_queue_assignments a
        JOIN trucks b ON a.truck_id = b.id
        WHERE a.lane_id = NEW.lane_id 
          AND a.exit_time IS NULL 
          AND abbreviate_words(b.typeoftruck) =_truck_type;
		
         SELECT abbreviate_words(b.typeoftruck) 
        INTO _bb
        FROM cp_queue_assignments a
        JOIN trucks b ON a.truck_id = b.id
        WHERE a.lane_id = NEW.lane_id 
          AND a.exit_time IS NULL 
          AND abbreviate_words(b.typeoftruck) =_truck_type;

         
        select sum(rb.max_capacity)::numeric into _max_capacity from rulesofsimpang_bayah rb
        where  lane_id = NEW.lane_id AND truck_type = _truck_type
        group by 
		rb.lane_id,rb.truck_type;
	
		  RAISE NOTICE 'total_lane % - % - % ', _total_lane,_max_capacity, _bb;
        IF _total_lane >= _max_capacity THEN
            RAISE EXCEPTION 'Lane capacity exceeded for new lane_id: %, truck_type: %', NEW.lane_id, _truck_type;
        END IF;
    END IF;

    -- Validasi lane lama (hanya jika lane_id berubah)
    IF OLD.lane_id IS NOT NULL AND NEW.lane_id IS DISTINCT FROM OLD.lane_id THEN
        SELECT COUNT(*)::numeric
        INTO _total_lane
        FROM cp_queue_assignments a
        JOIN trucks b ON a.truck_id = b.id
        WHERE a.lane_id = OLD.lane_id 
          AND a.exit_time IS NULL 
          AND abbreviate_words(b.typeoftruck) = _truck_type;

        select sum(rb.max_capacity)::numeric into _max_capacity from rulesofsimpang_bayah rb
        where  lane_id = NEW.lane_id AND truck_type = _truck_type
        group by 
		rb.lane_id,rb.truck_type;
	
        IF _total_lane >= _max_capacity THEN
            RAISE EXCEPTION 'Lane capacity exceeded for old lane_id: %, truck_type: %', OLD.lane_id, _truck_type;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_validate_lane_capacity
BEFORE INSERT OR UPDATE ON cp_queue_assignments
FOR EACH ROW
EXECUTE FUNCTION validate_lane_capacity();

