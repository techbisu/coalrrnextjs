-- CreateTable
CREATE TABLE "document" (
    "id" TEXT NOT NULL,
    "vaultable_type" TEXT NOT NULL,
    "vaultable_id" TEXT NOT NULL,
    "checklist_item_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size_kb" INTEGER NOT NULL,
    "virus_scan_status" TEXT NOT NULL DEFAULT 'clean',
    "uploaded_by" TEXT NOT NULL,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

