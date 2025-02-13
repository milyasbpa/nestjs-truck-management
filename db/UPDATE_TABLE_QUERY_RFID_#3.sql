ALTER TABLE rfid_transaction
ADD COLUMN invalid_rfid BOOLEAN;

ALTER TABLE rfid_transaction
ADD COLUMN cp_id integer;

ALTER TYPE public."rfid_transaction_event_type_enum"
ADD VALUE 'On Process',
ADD VALUE 'Completed';