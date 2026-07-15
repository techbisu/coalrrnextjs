-- CreateTable
CREATE TABLE "rnr_asset_payroll" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "payroll_code" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Drafting',
    "total_value" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "rnr_asset_payroll_pkey" PRIMARY KEY ("id")
);

