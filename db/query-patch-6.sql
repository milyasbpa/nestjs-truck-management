delete from cps;
alter sequence cps_cp_id_seq restart with 1;
insert into cps(cp_name,max_capacity,positioning) 
select cp_name,10, row_number () over (order by cp_name) as positioning from cctv_device_items group by cp_name order by cp_name asc;
update cctv_device_items set live_condition=Array[1,2] where cp_name='CP1';
update cctv_device_items set live_condition=Array[1] where cp_name='CP2A';
update cctv_device_items set live_condition=Array[2] where cp_name='CP3';
update cctv_device_items set live_condition=Array[1] where cp_name='CP4';
update cctv_device_items set live_condition=Array[1] where cp_name='CP5';
update cctv_device_items set live_condition=Array[1,2,3,4,5,6,7,8,9] where cp_name='CP6';
update cctv_device_items set live_condition=Array[1,2,3,4,5,6,7,8,9] where cp_name='CP7';
update cctv_device_items set live_condition=Array[1,2,3,4,5,6,7,8,9] where cp_name='CP8';
update cctv_device_items set live_condition=Array[2] where cp_name='CP9';
alter table cps add column status boolean default true;
delete from cron_schedule where cron_name='ApiGetVehicles';
insert into cron_schedule(cron_name,schedule,is_active) 
values('ApiGetVehicles','*/1 * * * * *',true);
alter table cron_schedule add constraint unique_cron_name UNIQUE (cron_name);
insert into cron_schedule(cron_name,schedule,is_active) 
values('ApiChekCPStatus','*/1 * * * * *',true);
