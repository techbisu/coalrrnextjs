-- CreateTable
CREATE TABLE "rnr_asset_payroll_line" (
    "id" TEXT NOT NULL,
    "payroll_id" TEXT NOT NULL,
    "beneficiary_name" TEXT NOT NULL,
    "entitlement_type" TEXT NOT NULL,
    "valuation_amount" DECIMAL(15,2) NOT NULL,
    "pwd_rate_reference" TEXT,
    "formula_snapshot" TEXT NOT NULL,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "rnr_asset_payroll_line_pkey" PRIMARY KEY ("id")
);

