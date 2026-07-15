-- CreateTable
CREATE TABLE "document_instance" (
    "id" TEXT NOT NULL,
    "template_code" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "document_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "form_data" JSONB,
    "generated_docx_path" TEXT,
    "generated_pdf_path" TEXT,
    "generated_docx_id" TEXT,
    "generated_pdf_id" TEXT,
    "resolver_fields_json" JSONB,
    "resolver_tables_json" JSONB,
    "resolver_signatures_json" JSONB,
    "final_fields_json" JSONB,
    "signature_data_json" JSONB,
    "resolver_version" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entry_by" TEXT,
    "updt_by" TEXT,

    CONSTRAINT "document_instance_pkey" PRIMARY KEY ("id")
);

