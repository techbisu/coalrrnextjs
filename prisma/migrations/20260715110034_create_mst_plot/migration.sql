-- CreateTable
CREATE TABLE "mst_plot" (
    "id" TEXT NOT NULL,
    "mouza_lgd" BIGINT NOT NULL DEFAULT 0,
    "plot_number" TEXT NOT NULL,
    "khata_number" TEXT,
    "land_type" TEXT NOT NULL,
    "area_acres" DECIMAL(10,4) NOT NULL,
    "geometry" TEXT,
    "exhausted_area_for_jobs" DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
    "remaining_job_quota" INTEGER NOT NULL DEFAULT 0,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "mst_plot_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "mst_plot_mouza_lgd_plot_number_key" ON "mst_plot"("mouza_lgd", "plot_number");

