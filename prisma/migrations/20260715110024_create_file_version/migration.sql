-- CreateTable
CREATE TABLE "file_version" (
    "id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL DEFAULT 1,
    "storage_provider" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "bucket" TEXT,
    "mime_type" TEXT NOT NULL,
    "extension" TEXT,
    "size_bytes" BIGINT NOT NULL,
    "checksum" TEXT,
    "entry_by" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "updt_by" TEXT,

    CONSTRAINT "file_version_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "file_version_file_id_version_number_key" ON "file_version"("file_id", "version_number");

