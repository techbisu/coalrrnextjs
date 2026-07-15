-- CreateTable
CREATE TABLE "workflow_review_task" (
    "id" TEXT NOT NULL,
    "reviewable_type" TEXT NOT NULL,
    "reviewable_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decided_by" TEXT,
    "decided_at" TIMESTAMP(3),
    "comment" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "workflow_review_task_pkey" PRIMARY KEY ("id")
);

