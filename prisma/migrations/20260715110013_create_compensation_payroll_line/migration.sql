-- CreateTable
CREATE TABLE "compensation_payroll_line" (
    "id" TEXT NOT NULL,
    "payroll_id" TEXT NOT NULL,
    "landowner_name" TEXT NOT NULL,
    "plot_reference" TEXT NOT NULL,
    "land_value" DECIMAL(15,2) NOT NULL,
    "asset_value" DECIMAL(15,2) NOT NULL,
    "solatium_amount" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "escalation_amount" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "total_award" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "years_since_notification" INTEGER NOT NULL DEFAULT 0,
    "formula_snapshot" TEXT NOT NULL,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "compensation_payroll_line_pkey" PRIMARY KEY ("id")
);

