-- CreateTable
CREATE TABLE "compensation_payroll" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "payroll_code" TEXT NOT NULL,
    "multiplication_factor" DECIMAL(6,4) NOT NULL DEFAULT 1.0000,
    "state" TEXT NOT NULL DEFAULT 'Drafting',
    "landowner_count" INTEGER NOT NULL DEFAULT 0,
    "total_award" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "meta" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "compensation_payroll_pkey" PRIMARY KEY ("id")
);

