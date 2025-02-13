CREATE TABLE users (
	id bigserial NOT NULL,
	"createdAt" timestamp NOT NULL DEFAULT now(),
	"updatedAt" timestamp NOT NULL DEFAULT now(),
	"deletedAt" timestamp NULL,
	"createdBy" varchar(50) NULL,
	"updatedBy" varchar(50) NULL,
	"deletedBy" varchar(50) NULL,
	email varchar(50) NOT NULL,
	name varchar(200) NOT NULL,
	username varchar(200) NULL,
	avatar varchar(500) NULL,
	CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id)
);