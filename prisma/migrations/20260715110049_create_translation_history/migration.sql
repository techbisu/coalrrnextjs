-- CreateTable
CREATE TABLE "translation_history" (
    "id" TEXT NOT NULL,
    "translation_value_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "changed_by" TEXT,
    "change_reason" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "translation_history_pkey" PRIMARY KEY ("id")
);

