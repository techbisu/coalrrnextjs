-- CreateTable
CREATE TABLE "translation_key" (
    "id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "translation_key_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "translation_key_module_id_key_key" ON "translation_key"("module_id", "key");

