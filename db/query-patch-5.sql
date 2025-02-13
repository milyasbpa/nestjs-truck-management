alter table lanes add column positioning integer null;
create index idx_positioning_lane on LANES (positioning);
alter table cps add column positioning integer null;
create index idx_positioning_cps on cps (positioning);


   