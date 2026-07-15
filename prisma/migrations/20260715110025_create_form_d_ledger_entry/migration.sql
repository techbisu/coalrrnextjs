-- CreateTable
CREATE TABLE "form_d_ledger_entry" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "plot_id" TEXT NOT NULL,
    "amount_land" DECIMAL(15,2) NOT NULL,
    "amount_rnr" DECIMAL(15,2) NOT NULL,
    "payee_type" TEXT NOT NULL,
    "payee_name" TEXT NOT NULL,
    "rtgs_utr_reference" TEXT,
    "row_hash" TEXT,
    "previous_hash" TEXT,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "state" TEXT NOT NULL DEFAULT 'pending',
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "form_d_ledger_entry_pkey" PRIMARY KEY ("id")
);

