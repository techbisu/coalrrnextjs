-- CreateTable
CREATE TABLE "mst_project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mine_cd" TEXT NOT NULL,
    "total_land_limit_acres" DECIMAL(10,4) NOT NULL,
    "total_budget_ceiling" DECIMAL(15,2) NOT NULL,
    "total_employment_quota" INTEGER NOT NULL,
    "boundary" TEXT NOT NULL,
    "statutory_clearances" TEXT,
    "locked_at" TIMESTAMP(3),
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,
    "area_cd" TEXT,
    "state_lgd" BIGINT,
    "pr_doc_id" TEXT,

    CONSTRAINT "mst_project_pkey" PRIMARY KEY ("id")
);

