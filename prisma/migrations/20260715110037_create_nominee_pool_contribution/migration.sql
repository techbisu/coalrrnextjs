-- CreateTable
CREATE TABLE "nominee_pool_contribution" (
    "id" TEXT NOT NULL,
    "pool_id" TEXT NOT NULL,
    "form_i_claim_id" TEXT NOT NULL,
    "share_acres" DECIMAL(10,4) NOT NULL,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "nominee_pool_contribution_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "nominee_pool_contribution_pool_id_form_i_claim_id_key" ON "nominee_pool_contribution"("pool_id", "form_i_claim_id");

