-- CreateTable
CREATE TABLE "signed_url_log" (
    "id" TEXT NOT NULL,
    "signature_hash" TEXT NOT NULL,
    "url_path" TEXT NOT NULL,
    "entity_id" TEXT,
    "action" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_one_time" BOOLEAN NOT NULL DEFAULT false,
    "is_consumed" BOOLEAN NOT NULL DEFAULT false,
    "consumed_at" TIMESTAMP(3),
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "signed_url_log_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "signed_url_log_signature_hash_key" ON "signed_url_log"("signature_hash");

