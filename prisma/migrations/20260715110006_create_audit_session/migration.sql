-- CreateTable
CREATE TABLE "audit_session" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "status" TEXT NOT NULL,
    "locked_by" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "audit_session_pkey" PRIMARY KEY ("id")
);

