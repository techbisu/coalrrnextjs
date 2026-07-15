-- CreateTable
CREATE TABLE "audit_download" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "file_type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "ip_address" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "audit_download_pkey" PRIMARY KEY ("id")
);

