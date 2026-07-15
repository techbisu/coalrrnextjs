-- CreateTable
CREATE TABLE "employment_application" (
    "id" TEXT NOT NULL,
    "application_code" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "nominee_pool_id" TEXT NOT NULL,
    "form_ix_balance_acres" DECIMAL(10,4) NOT NULL,
    "form_x_balance_jobs" INTEGER NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Drafting',
    "exception_flags" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "employment_application_pkey" PRIMARY KEY ("id")
);

