-- CreateTable
CREATE TABLE "document_audit_log" (
    "id" TEXT NOT NULL,
    "document_instance_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "role" TEXT,
    "user_id" TEXT,
    "user_name" TEXT,
    "ip_address" TEXT,
    "browser" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "document_audit_log_pkey" PRIMARY KEY ("id")
);

