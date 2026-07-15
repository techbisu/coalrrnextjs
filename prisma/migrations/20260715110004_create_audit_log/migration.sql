-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "module_name" TEXT NOT NULL,
    "entity_name" TEXT,
    "entity_id" TEXT,
    "user_id" TEXT,
    "user_role" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "request_url" TEXT,
    "request_method" TEXT,
    "remarks" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_id" TEXT,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

