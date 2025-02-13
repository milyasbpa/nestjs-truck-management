create table roles(
  id varchar(10) primary key,
  role_name  varchar(20),
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  auditupdate timestamp with time zone default now()
 );
 ALTER TABLE public.roles OWNER TO dev_rppj;
 create table menus(
  id varchar(50) primary key,
  menu_name  varchar(100),
  detail_roles boolean default false, 
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  auditupdate timestamp with time zone default now()
 );
 ALTER TABLE public.menus OWNER TO dev_rppj;

  create table user_roles(
	 id varchar(200) primary key,
	 user_id bigint not null references users(id) on delete cascade,
	 menu_id varchar(50) not null references menus(id) on delete cascade,
	 role_id varchar(10) not null references roles(id) on delete cascade,
	 created_at timestamp with time zone default now(),
	 auditupdate timestamp with time zone default now()
 );
ALTER TABLE public.user_roles OWNER TO dev_rppj;

create or replace function set_id_roles_to_users()
 returns trigger as $$
 begin 
	new.id:=new.user_id::text||'#'||new.menu_id||'#'||coalesce(new.role_id,'_');
    return new;
 end
 $$ language plpgsql;
 ALTER FUNCTION set_id_roles_to_users() OWNER TO dev_rppj;

 create or replace trigger trg_insert_roles_users
 before insert or update on user_roles 
 for each row execute function set_id_roles_to_users();
 ALTER TABLE public.user_roles OWNER TO dev_rppj;

 insert into roles(id,role_name) 
 values ('add','add/created'), ('edit','edit/update'), ('read','read'), ('delete','delete/remove'), ('export','export');

 insert into menus(id,menu_name,detail_roles) 
 values('mo-dash','Dashboard',true),
 ('mo-um','User Management',true),
 ('mo-tm','Truck Management',true),
 ('mo-cps','Cps Master',true),
 ('mo-lanes','Lanes Master',true),
 ('mo-lr','Rules of Lanes',true),
 ('mo-cpsr','Rules of CPS',true),
 ('mo-tvm','Truck/Vechicles Master',true),
 ('mo-driver','Driver Master',true),
 ('mo-cctv','CCTV Master',true),
 ('mo-gm','Geofences Master',true),
 ('mo-cron','Cron Scheduler',true),
 ('mo-street','Streets Master',true),
 ('mo-actlog','Activities Log',true),
 ('mo-report','Reports',true);

--Default Users Roles ADMIN
insert into user_roles(user_id,menu_id,role_id)
values(1,'mo-dash','edit' ),(1,'mo-dash','export'),(1,'mo-dash','read'),
(1,'mo-um','add' ), (1,'mo-um','edit'),(1,'mo-um','delete'),(1,'mo-um','export'),(1,'mo-um','read'),
(1,'mo-tm','add' ), (1,'mo-tm','edit'),(1,'mo-tm','delete'),(1,'mo-tm','export'),(1,'mo-tm','read'),
(1,'mo-cps','add' ), (1,'mo-cps','edit'),(1,'mo-cps','delete'),(1,'mo-cps','export'),(1,'mo-cps','read'),
(1,'mo-lanes','add' ), (1,'mo-lanes','edit'),(1,'mo-lanes','delete'),(1,'mo-lanes','export'),(1,'mo-lanes','read'),
(1,'mo-lr','add' ), (1,'mo-lr','edit'),(1,'mo-lr','delete'),(1,'mo-lr','export'),(1,'mo-lr','read'),
(1,'mo-cpsr','add' ), (1,'mo-cpsr','edit'),(1,'mo-cpsr','delete'),(1,'mo-cpsr','export'),(1,'mo-cpsr','read' ),
(1,'mo-tvm','read' ),
(1,'mo-driver','add' ), (1,'mo-driver','edit'),(1,'mo-driver','delete'),(1,'mo-driver','export'),(1,'mo-driver','read'),
(1,'mo-cctv','add' ), (1,'mo-cctv','edit'),(1,'mo-cctv','delete'),(1,'mo-cctv','export'),(1,'mo-cctv','read'),
(1,'mo-gm','add' ), (1,'mo-gm','edit'),(1,'mo-gm','delete'),(1,'mo-gm','export'),(1,'mo-gm','read'),
(1,'mo-cron','add' ), (1,'mo-cron','edit'),(1,'mo-cron','delete'),(1,'mo-cron','export'),(1,'mo-cron','read'),
(1,'mo-street','read'),
(1,'mo-actlog','read'),(1,'mo-actlog','delete'),(1,'mo-actlog','export'),
(1,'mo-report','read');

