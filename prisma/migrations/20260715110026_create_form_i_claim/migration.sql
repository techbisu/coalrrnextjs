-- CreateTable
CREATE TABLE "form_i_claim" (
    "id" TEXT NOT NULL,
    "claim_code" TEXT NOT NULL,
    "plot_id" TEXT NOT NULL,
    "citizen_id_hash" TEXT NOT NULL,
    "claimant_name" TEXT NOT NULL,
    "own_share_acres" DECIMAL(10,4) NOT NULL,
    "opted_monetary_in_lieu_of_employment" BOOLEAN NOT NULL DEFAULT false,
    "bank_account_number" TEXT,
    "bank_ifsc" TEXT,
    "state" TEXT NOT NULL DEFAULT 'Drafting',
    "submitted_at" TIMESTAMP(3),
    "transparency_window_ends_at" TIMESTAMP(3),
    "meta" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "form_i_claim_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "form_i_claim_citizen_id_hash_plot_id_key" ON "form_i_claim"("citizen_id_hash", "plot_id");

