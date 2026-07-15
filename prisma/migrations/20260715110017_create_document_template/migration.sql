-- CreateTable
CREATE TABLE "document_template" (
    "id" TEXT NOT NULL,
    "template_code" TEXT NOT NULL,
    "template_name" TEXT NOT NULL,
    "description" TEXT,
    "storage_path" TEXT NOT NULL,
    "config" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "document_template_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "document_template_template_code_key" ON "document_template"("template_code");

