ALTER TABLE cp_devices
DROP COLUMN IF EXISTS connection,
DROP COLUMN IF EXISTS status,
DROP COLUMN IF EXISTS item_name,
DROP COLUMN IF EXISTS item_id;

ALTER TABLE cp_devices
ADD COLUMN CONNECTION BOOLEAN DEFAULT TRUE,
ADD COLUMN status BOOLEAN DEFAULT TRUE,
ADD COLUMN item_name VARCHAR(120) NULL,
ADD COLUMN item_id VARCHAR(120) NULL;

UPDATE cp_devices SET item_name = 'CP2A_FEEDER_STATUS_RUNNING', item_id = 'y6lwSCBa' WHERE id = 2;
UPDATE cp_devices SET item_name = 'CP2A_REAKER_STATUS_RUNNING', item_id = 'g6JY1KqW' WHERE id = 3;
UPDATE cp_devices SET item_name = 'CP3_CHAIN_FEEDER_STATUS_CONTROL', item_id = 'HoNGH24m' WHERE id = 4;
UPDATE cp_devices SET item_name = 'CP3_FEEDER_BREAKER_STATUS_CONTROL', item_id = '6YLBP7Nr' WHERE id = 5;
UPDATE cp_devices SET item_name = 'CP4_Chain_Feeder', item_id = 'YucUZqMs' WHERE id = 6;
UPDATE cp_devices SET item_name = 'CP4_Feeder_Breaker', item_id = 'BRRKPhnd' WHERE id = 7;
UPDATE cp_devices SET item_name = 'CHAIN_FEEDER_STATUS', item_id = 'No2ujeqn' WHERE id = 8;
UPDATE cp_devices SET item_name = 'FEEDER_BREAKER_STATUS', item_id = 'wJuqObi0' WHERE id = 9;
UPDATE cp_devices SET item_name = 'HMI_Data_BW101_Val', item_id = '0aYdeR07' WHERE id = 10;
UPDATE cp_devices SET item_name = 'Flowrate Belt Scale CV 109', item_id = 'ua4srhy3' WHERE id = 11;
UPDATE cp_devices SET item_name = 'CP8.AI.BELT_SCALE_FLOWRATE', item_id = 'c8Vs0wq5' WHERE id = 12;
UPDATE cp_devices SET item_name = 'CP9_CHAIN_FEEDER_STATUS_EQ', item_id = '68oq4rdj' WHERE id = 13;
UPDATE cp_devices SET item_name = 'CP9_FEEDER_BREAKER_STATUS_EQ', item_id = 'kqqAWH9L' WHERE id = 14;
UPDATE cp_devices SET item_name = 'CP2New_Run_Status_CV-124', item_id = 'z38Yj21e' WHERE id = 15;
UPDATE cp_devices SET item_name = 'CP2New_Run_Status_Feeder_Breaker', item_id = '4C2P5sqW' WHERE id = 16;
UPDATE cp_devices SET item_name = 'CP1_CHAIN_FEEDER_STATUS_EQ', item_id = 'yAPn7X05' WHERE id = 1;
INSERT INTO cp_devices (item_name, uid, name, cp_id,item_id) VALUES ('CP1_FEEDER_BREAKER_STATUS_EQ', 'MQU82viu', 'opcua_8', 1,'Q7yGUZcR');
