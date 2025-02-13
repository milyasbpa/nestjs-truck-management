delete from queue_lane_rules cascade;
alter sequence queue_lane_rules_id_seq restart with 1;
ALTER TABLE queue_lane_rules OWNER TO dev_rppj; 
ALTER SEQUENCE queue_lane_rules_id_seq OWNER TOdev_rppj;

insert into queue_lane_rules(queue_lane_id,max_capacity,truck_type) 
values (1,3,'SDT'),(1,3,'DT'),(1,3,'DDT'),
(2,3,'SDT'),(2,3,'DT'),(2,3,'DDT'),
(3,3,'SDT'),(3,3,'DT'),(3,3,'DDT'),
(4,3,'SDT'),(4,3,'DT'),(4,3,'DDT');
(5,3,'SDT'),(5,3,'DT'),(5,3,'DDT');
(6,3,'SDT'),(6,3,'DT'),(6,3,'DDT');

alter table users add column passw text;
alter table users add constraint unique_email UNIQUE(email);
alter table users alter column avatar type text;
ALTER TABLE users OWNER TO dev_rppj;



 
