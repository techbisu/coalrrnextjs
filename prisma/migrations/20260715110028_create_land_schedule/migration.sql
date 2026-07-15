-- CreateTable
CREATE TABLE "land_schedule" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "schedule_code" TEXT NOT NULL,
    "acquisition_mode" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Drafting',
    "mode_specific_checklist" TEXT,
    "meta" TEXT,
    "proposal_title" TEXT,
    "description" TEXT,
    "proposed_by" TEXT,
    "proposed_by_role" TEXT,
    "area_office" TEXT,
    "mine_cd" TEXT,
    "adjacent_colliery" TEXT,
    "total_area_acres" DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
    "annexure_a" TEXT,
    "annexure_b" TEXT,
    "annexure_c" TEXT,
    "notification_date" TIMESTAMP(3),
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "land_schedule_pkey" PRIMARY KEY ("id")
);

