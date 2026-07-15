-- CreateTable
CREATE TABLE "captcha_audit_log" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ip_address" TEXT,
    "purpose" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "captcha_audit_log_pkey" PRIMARY KEY ("id")
);

