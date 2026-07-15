-- CreateTable
CREATE TABLE "translation_value" (
    "id" TEXT NOT NULL,
    "translation_key_id" TEXT NOT NULL,
    "language_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "entry_by" TEXT,
    "approved_by" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,
    "updt_by" TEXT,

    CONSTRAINT "translation_value_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "translation_value_translation_key_id_language_id_key" ON "translation_value"("translation_key_id", "language_id");

