-- CreateTable
CREATE TABLE "download_log" (
    "id" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "document_id" TEXT,
    "storage_path" TEXT NOT NULL,
    "downloaded_by" TEXT,
    "user_name" TEXT,
    "ip_address" TEXT,
    "browser" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "download_log_pkey" PRIMARY KEY ("id")
);

