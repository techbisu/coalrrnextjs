-- CreateTable
CREATE TABLE "nominee_pool" (
    "id" TEXT NOT NULL,
    "nominee_aadhaar_hash" TEXT NOT NULL,
    "nominee_name" TEXT NOT NULL,
    "pooled_acreage" DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
    "apply_button_unlocked" BOOLEAN NOT NULL DEFAULT false,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "nominee_pool_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "nominee_pool_nominee_aadhaar_hash_key" ON "nominee_pool"("nominee_aadhaar_hash");

