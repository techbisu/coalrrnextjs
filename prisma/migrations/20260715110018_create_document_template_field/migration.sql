-- CreateTable
CREATE TABLE "document_template_field" (
    "id" TEXT NOT NULL,
    "template_code" TEXT NOT NULL,
    "field_key" TEXT NOT NULL,
    "field_type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "options" JSONB,
    "show_if" JSONB,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "document_template_field_pkey" PRIMARY KEY ("id")
);

