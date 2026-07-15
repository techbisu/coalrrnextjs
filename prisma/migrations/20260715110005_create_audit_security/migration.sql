-- CreateTable
CREATE TABLE "audit_security" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_id" TEXT,
    "request_url" TEXT,
    "payload" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'HIGH',
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "audit_security_pkey" PRIMARY KEY ("id")
);

