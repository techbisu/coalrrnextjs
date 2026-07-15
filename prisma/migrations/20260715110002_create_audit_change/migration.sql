-- CreateTable
CREATE TABLE "audit_change" (
    "id" TEXT NOT NULL,
    "audit_log_id" TEXT NOT NULL,
    "field_name" TEXT,
    "old_value" TEXT,
    "new_value" TEXT,
    "json_diff" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "audit_change_pkey" PRIMARY KEY ("id")
);

