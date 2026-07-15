-- CreateTable
CREATE TABLE "grievance" (
    "id" TEXT NOT NULL,
    "grievance_code" TEXT NOT NULL,
    "related_type" TEXT NOT NULL,
    "related_id" TEXT NOT NULL,
    "complainant_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sla_due_at" TIMESTAMP(3) NOT NULL,
    "resolution" TEXT,
    "resolved_at" TIMESTAMP(3),
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "grievance_pkey" PRIMARY KEY ("id")
);

