-- CreateTable
CREATE TABLE "file_attachment" (
    "id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "module" TEXT,
    "attached_by" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "file_attachment_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "file_attachment_file_id_entity_type_entity_id_key" ON "file_attachment"("file_id", "entity_type", "entity_id");

