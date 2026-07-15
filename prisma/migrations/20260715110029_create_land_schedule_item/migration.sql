-- CreateTable
CREATE TABLE "land_schedule_item" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "plot_id" TEXT NOT NULL,
    "annexure_tag" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "land_schedule_item_pkey" PRIMARY KEY ("id")
);

