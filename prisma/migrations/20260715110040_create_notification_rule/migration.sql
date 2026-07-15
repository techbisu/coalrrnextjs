-- CreateTable
CREATE TABLE "notification_rule" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "recipient_resolver" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "notification_rule_pkey" PRIMARY KEY ("id")
);

