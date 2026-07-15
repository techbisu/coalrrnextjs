-- CreateTable
CREATE TABLE "master"."acqu_mode" (
    "acq_mode_id" BIGINT NOT NULL,
    "aquisition_method" VARCHAR(50) NOT NULL,
    "entry_by" VARCHAR(10),
    "updt_by" VARCHAR(10),
    "entry_ts" BIGINT DEFAULT date_part('epoch'::text, now()),
    "updt_ts" BIGINT DEFAULT date_part('epoch'::text, now()),
    "del_ts" BIGINT,

    CONSTRAINT "aquisition_method_pkey" PRIMARY KEY ("acq_mode_id")
);


-- CreateTable
CREATE TABLE "master"."area_master" (
    "area_cd" VARCHAR(30) NOT NULL,
    "area_en" VARCHAR(255) NOT NULL,
    "area_loc_vern" VARCHAR(255),
    "is_active" BOOLEAN DEFAULT true,
    "state_lgd" BIGINT,
    "entry_by" VARCHAR(10),
    "updt_by" VARCHAR(10),
    "entry_ts" BIGINT DEFAULT date_part('epoch'::text, now()),
    "updt_ts" BIGINT DEFAULT date_part('epoch'::text, now()),
    "del_ts" BIGINT,
    "area_remarks" TEXT,

    CONSTRAINT "area_master_pkey" PRIMARY KEY ("area_cd")
);


-- CreateTable
CREATE TABLE "master"."block_master" (
    "block_lgd" BIGINT NOT NULL,
    "block_en" VARCHAR(255) NOT NULL,
    "block_loc_vern" VARCHAR(255),
    "district_lgd" BIGINT NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "entry_by" VARCHAR(10),
    "updt_by" VARCHAR(10),
    "entry_ts" BIGINT DEFAULT date_part('epoch'::text, now()),
    "updt_ts" BIGINT DEFAULT date_part('epoch'::text, now()),
    "del_ts" BIGINT,
    "state_lgd" BIGINT,

    CONSTRAINT "block_master_pkey" PRIMARY KEY ("block_lgd")
);


-- CreateTable
CREATE TABLE "master"."cast_master" (
    "cast_id" BIGINT NOT NULL,
    "cast_type" VARCHAR(255) NOT NULL,
    "entry_by" VARCHAR(10),
    "updt_by" VARCHAR(10),
    "entry_ts" BIGINT DEFAULT date_part('epoch'::text, now()),
    "updt_ts" BIGINT DEFAULT date_part('epoch'::text, now()),
    "del_ts" BIGINT,

    CONSTRAINT "cast_master_pkey" PRIMARY KEY ("cast_id")
);


-- CreateTable
CREATE TABLE "master"."chk_master_new" (
    "chk_id" INTEGER NOT NULL,
    "chk_description" TEXT,
    "chk_type" VARCHAR(15),
    "chk_sub_type" VARCHAR(15),
    "chk_inp_type" VARCHAR(50),
    "acq_mode_id" BIGINT,
    "entry_by" VARCHAR(10),
    "updt_by" VARCHAR(10),
    "entry_ts" BIGINT,
    "updt_ts" BIGINT,
    "is_initial" BOOLEAN,
    "noti_type" VARCHAR(30),
    "chk_inp_instruc" TEXT,
    "local_vernacular" TEXT,

    CONSTRAINT "chk_master_new_pkey" PRIMARY KEY ("chk_id")
);


-- CreateTable
CREATE TABLE "master"."district_master" (
    "district_lgd" BIGINT NOT NULL,
    "district_en" VARCHAR(255) NOT NULL,
    "district_loc_vern" VARCHAR(255),
    "state_lgd" BIGINT NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "entry_by" VARCHAR(10),
    "updt_by" VARCHAR(10),
    "entry_ts" BIGINT DEFAULT date_part('epoch'::text, now()),
    "updt_ts" BIGINT DEFAULT date_part('epoch'::text, now()),
    "del_ts" BIGINT,

    CONSTRAINT "district_master_pkey" PRIMARY KEY ("district_lgd")
);


-- CreateTable
CREATE TABLE "master"."landclass_master" (
    "landc_id" BIGINT NOT NULL,
    "landt_id" BIGINT,
    "land_class" VARCHAR(255) NOT NULL,
    "entry_by" VARCHAR(10),
    "updt_by" VARCHAR(10),
    "entry_ts" BIGINT DEFAULT date_part('epoch'::text, now()),
    "updt_ts" BIGINT DEFAULT date_part('epoch'::text, now()),
    "del_ts" BIGINT,
    "loc_vern" VARCHAR(30),
    "district_lgd" BIGINT,
    "is_active" BOOLEAN DEFAULT true,

    CONSTRAINT "landclass_master_pkey" PRIMARY KEY ("landc_id")
);


-- CreateTable
CREATE TABLE "master"."landtype_master" (
    "landt_id" BIGINT NOT NULL,
    "land_type" VARCHAR(255) NOT NULL,
    "entry_by" VARCHAR(10),
    "updt_by" VARCHAR(10),
    "entry_ts" BIGINT DEFAULT date_part('epoch'::text, now()),
    "updt_ts" BIGINT DEFAULT date_part('epoch'::text, now()),
    "del_ts" BIGINT,

    CONSTRAINT "landtype_master_pkey" PRIMARY KEY ("landt_id")
);


-- CreateTable
CREATE TABLE "master"."mine_master" (
    "mine_cd" VARCHAR(30) NOT NULL,
    "mine_en" VARCHAR(255) NOT NULL,
    "mine_loc_vern" VARCHAR(255),
    "area_cd" VARCHAR(30),
    "area_coverd" DECIMAL,
    "area_aquired" DECIMAL,
    "entry_by" VARCHAR(10),
    "updt_by" VARCHAR(10),
    "entry_ts" BIGINT DEFAULT date_part('epoch'::text, now()),
    "updt_ts" BIGINT DEFAULT date_part('epoch'::text, now()),
    "del_ts" BIGINT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "state_lgd" BIGINT,
    "mine_remarks" TEXT,

    CONSTRAINT "mine_master_pkey" PRIMARY KEY ("mine_cd")
);


-- CreateTable
CREATE TABLE "master"."mouza_master" (
    "mouza_lgd" BIGINT NOT NULL,
    "mouza_en" VARCHAR(255) NOT NULL,
    "mouza_loc_vern" VARCHAR(255),
    "block_lgd" BIGINT NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "jl_no" VARCHAR(3),
    "entry_by" VARCHAR(10),
    "updt_by" VARCHAR(10),
    "entry_ts" BIGINT DEFAULT date_part('epoch'::text, now()),
    "updt_ts" BIGINT DEFAULT date_part('epoch'::text, now()),
    "del_ts" BIGINT,
    "state_lgd" BIGINT,
    "district_lgd" BIGINT,
    "gis_enable" BOOLEAN NOT NULL DEFAULT false,
    "halka_no" VARCHAR(2),

    CONSTRAINT "mouza_master_pkey" PRIMARY KEY ("mouza_lgd")
);


-- CreateTable
CREATE TABLE "master"."owner_type_master" (
    "owner_type_id" BIGINT NOT NULL,
    "owner_type" VARCHAR(255) NOT NULL,
    "entry_by" VARCHAR(10),
    "updt_by" VARCHAR(10),
    "entry_ts" BIGINT DEFAULT date_part('epoch'::text, now()),
    "updt_ts" BIGINT DEFAULT date_part('epoch'::text, now()),
    "del_ts" BIGINT,

    CONSTRAINT "owner_type_master_pkey" PRIMARY KEY ("owner_type_id")
);


-- CreateTable
CREATE TABLE "master"."present_land_use" (
    "id" BIGINT NOT NULL,
    "present_land_use" VARCHAR(50) NOT NULL,

    CONSTRAINT "present_land_use_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "master"."ps_master" (
    "ps_lgd" BIGINT NOT NULL,
    "ps_en" VARCHAR(255) NOT NULL,
    "ps_loc_vern" VARCHAR(255),
    "district_lgd" BIGINT NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "entry_by" VARCHAR(10),
    "updt_by" VARCHAR(10),
    "entry_ts" BIGINT DEFAULT date_part('epoch'::text, now()),
    "updt_ts" BIGINT DEFAULT date_part('epoch'::text, now()),
    "del_ts" BIGINT,
    "state_lgd" BIGINT,

    CONSTRAINT "ps_master_pkey" PRIMARY KEY ("ps_lgd")
);


-- CreateTable
CREATE TABLE "master"."state_master" (
    "state_lgd" BIGINT NOT NULL,
    "state_en" VARCHAR(255) NOT NULL,
    "state_loc_vern" VARCHAR(255),
    "short_code" VARCHAR(20),
    "is_active" BOOLEAN DEFAULT true,
    "entry_by" VARCHAR(10),
    "updt_by" VARCHAR(10),
    "entry_ts" BIGINT DEFAULT date_part('epoch'::text, now()),
    "updt_ts" BIGINT DEFAULT date_part('epoch'::text, now()),
    "del_ts" BIGINT,

    CONSTRAINT "state_master_pkey" PRIMARY KEY ("state_lgd")
);


-- CreateTable
CREATE TABLE "master"."vill_master" (
    "village_lgd" BIGINT NOT NULL,
    "village_name" VARCHAR(255) NOT NULL,
    "vill_loc_vern" VARCHAR(255) NOT NULL,
    "block_lgd" BIGINT NOT NULL,
    "ps_lgd" BIGINT NOT NULL,
    "entry_by" VARCHAR(10),
    "updt_by" VARCHAR(10),
    "entry_ts" BIGINT DEFAULT date_part('epoch'::text, now()),
    "updt_ts" BIGINT DEFAULT date_part('epoch'::text, now()),
    "del_ts" BIGINT,
    "is_active" BOOLEAN DEFAULT true,
    "district_lgd" BIGINT,
    "state_lgd" BIGINT,
    "vill_cd" VARCHAR(50),

    CONSTRAINT "village_master_pkey" PRIMARY KEY ("village_lgd")
);

