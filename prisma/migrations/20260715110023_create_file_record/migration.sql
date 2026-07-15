-- CreateTable
CREATE TABLE "file_record" (
    "id" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "owner_id" TEXT,
    "tags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "checksum" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "file_record_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "file_record_checksum_key" ON "file_record"("checksum");

