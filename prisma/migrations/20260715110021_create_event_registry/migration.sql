-- CreateTable
CREATE TABLE "event_registry" (
    "id" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "event_registry_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "event_registry_event_name_key" ON "event_registry"("event_name");

