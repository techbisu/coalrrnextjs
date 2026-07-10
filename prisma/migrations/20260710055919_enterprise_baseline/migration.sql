-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "portal" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT,
    "mobile" TEXT,
    "aadhaar_hash" TEXT,
    "name" TEXT NOT NULL,
    "password_hash" TEXT,
    "designation" TEXT,
    "colliery_code" TEXT,
    "plot_id" TEXT,
    "verified_at" TIMESTAMP(3),
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mst_project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "colliery_code" TEXT NOT NULL,
    "total_land_limit_acres" DECIMAL(10,4) NOT NULL,
    "total_budget_ceiling" DECIMAL(15,2) NOT NULL,
    "total_employment_quota" INTEGER NOT NULL,
    "boundary" TEXT NOT NULL,
    "statutory_clearances" TEXT,
    "locked_at" TIMESTAMP(3),
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mst_project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mst_mouza" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mst_mouza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mst_plot" (
    "id" TEXT NOT NULL,
    "mouza_id" TEXT NOT NULL,
    "plot_number" TEXT NOT NULL,
    "khata_number" TEXT,
    "land_type" TEXT NOT NULL,
    "area_acres" DECIMAL(10,4) NOT NULL,
    "geometry" TEXT,
    "exhausted_area_for_jobs" DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
    "remaining_job_quota" INTEGER NOT NULL DEFAULT 0,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mst_plot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "land_schedule" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "schedule_code" TEXT NOT NULL,
    "acquisition_mode" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Drafting',
    "mode_specific_checklist" TEXT,
    "meta" TEXT,
    "proposal_title" TEXT,
    "description" TEXT,
    "proposed_by" TEXT,
    "proposed_by_role" TEXT,
    "area_office" TEXT,
    "colliery_code" TEXT,
    "adjacent_colliery" TEXT,
    "total_area_acres" DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
    "annexure_a" TEXT,
    "annexure_b" TEXT,
    "annexure_c" TEXT,
    "notification_date" TIMESTAMP(3),
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "land_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "land_schedule_item" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "plot_id" TEXT NOT NULL,
    "annexure_tag" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "land_schedule_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_i_claim" (
    "id" TEXT NOT NULL,
    "claim_code" TEXT NOT NULL,
    "plot_id" TEXT NOT NULL,
    "citizen_id_hash" TEXT NOT NULL,
    "claimant_name" TEXT NOT NULL,
    "own_share_acres" DECIMAL(10,4) NOT NULL,
    "opted_monetary_in_lieu_of_employment" BOOLEAN NOT NULL DEFAULT false,
    "bank_account_number" TEXT,
    "bank_ifsc" TEXT,
    "state" TEXT NOT NULL DEFAULT 'Drafting',
    "submitted_at" TIMESTAMP(3),
    "transparency_window_ends_at" TIMESTAMP(3),
    "meta" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_i_claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compensation_payroll" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "payroll_code" TEXT NOT NULL,
    "multiplication_factor" DECIMAL(6,4) NOT NULL DEFAULT 1.0000,
    "state" TEXT NOT NULL DEFAULT 'Drafting',
    "landowner_count" INTEGER NOT NULL DEFAULT 0,
    "total_award" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "meta" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compensation_payroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compensation_payroll_line" (
    "id" TEXT NOT NULL,
    "payroll_id" TEXT NOT NULL,
    "landowner_name" TEXT NOT NULL,
    "plot_reference" TEXT NOT NULL,
    "land_value" DECIMAL(15,2) NOT NULL,
    "asset_value" DECIMAL(15,2) NOT NULL,
    "solatium_amount" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "escalation_amount" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "total_award" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "years_since_notification" INTEGER NOT NULL DEFAULT 0,
    "formula_snapshot" TEXT NOT NULL,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compensation_payroll_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paf_census_record" (
    "id" TEXT NOT NULL,
    "paf_id" TEXT NOT NULL,
    "claimant_name" TEXT NOT NULL,
    "category_of_entitlement" TEXT NOT NULL,
    "sc_st_obc_category" TEXT,
    "plot_id" TEXT,
    "photo_identity_card_doc" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paf_census_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rnr_asset_payroll" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "payroll_code" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Drafting',
    "total_value" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rnr_asset_payroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rnr_asset_payroll_line" (
    "id" TEXT NOT NULL,
    "payroll_id" TEXT NOT NULL,
    "beneficiary_name" TEXT NOT NULL,
    "entitlement_type" TEXT NOT NULL,
    "valuation_amount" DECIMAL(15,2) NOT NULL,
    "pwd_rate_reference" TEXT,
    "formula_snapshot" TEXT NOT NULL,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rnr_asset_payroll_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_d_ledger_entry" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "plot_id" TEXT NOT NULL,
    "amount_land" DECIMAL(15,2) NOT NULL,
    "amount_rnr" DECIMAL(15,2) NOT NULL,
    "payee_type" TEXT NOT NULL,
    "payee_name" TEXT NOT NULL,
    "rtgs_utr_reference" TEXT,
    "row_hash" TEXT,
    "previous_hash" TEXT,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "state" TEXT NOT NULL DEFAULT 'pending',
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_d_ledger_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nominee_pool" (
    "id" TEXT NOT NULL,
    "nominee_aadhaar_hash" TEXT NOT NULL,
    "nominee_name" TEXT NOT NULL,
    "pooled_acreage" DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
    "apply_button_unlocked" BOOLEAN NOT NULL DEFAULT false,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nominee_pool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nominee_pool_contribution" (
    "id" TEXT NOT NULL,
    "pool_id" TEXT NOT NULL,
    "form_i_claim_id" TEXT NOT NULL,
    "share_acres" DECIMAL(10,4) NOT NULL,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nominee_pool_contribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employment_application" (
    "id" TEXT NOT NULL,
    "application_code" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "nominee_pool_id" TEXT NOT NULL,
    "form_ix_balance_acres" DECIMAL(10,4) NOT NULL,
    "form_x_balance_jobs" INTEGER NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Drafting',
    "exception_flags" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employment_application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_review_task" (
    "id" TEXT NOT NULL,
    "reviewable_type" TEXT NOT NULL,
    "reviewable_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decided_by" TEXT,
    "decided_at" TIMESTAMP(3),
    "comment" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_review_task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document" (
    "id" TEXT NOT NULL,
    "vaultable_type" TEXT NOT NULL,
    "vaultable_id" TEXT NOT NULL,
    "checklist_item_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size_kb" INTEGER NOT NULL,
    "virus_scan_status" TEXT NOT NULL DEFAULT 'clean',
    "uploaded_by" TEXT NOT NULL,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doc_template" (
    "id" TEXT NOT NULL,
    "template_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "storage_path" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "dynamic_questions" TEXT,
    "workflow_config" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doc_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doc_instance" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doc_instance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doc_version" (
    "id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "docx_file_id" TEXT,
    "pdf_file_id" TEXT,
    "generated_by" TEXT NOT NULL,
    "metadata" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doc_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doc_dynamic_answer" (
    "id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "question_key" TEXT NOT NULL,
    "answer_value" TEXT NOT NULL,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doc_dynamic_answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doc_workflow_step" (
    "id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "comments" TEXT,
    "acted_by" TEXT,
    "acted_at" TIMESTAMP(3),
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doc_workflow_step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doc_signature" (
    "id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "signer_name" TEXT NOT NULL,
    "signer_designation" TEXT NOT NULL,
    "signature_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,

    CONSTRAINT "doc_signature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doc_audit_log" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "user_id" TEXT,
    "user_name" TEXT,
    "role" TEXT,
    "ip_address" TEXT,
    "browser" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doc_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "download_log" (
    "id" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "document_id" TEXT,
    "storage_path" TEXT NOT NULL,
    "downloaded_by" TEXT,
    "user_name" TEXT,
    "ip_address" TEXT,
    "browser" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "download_log_pkey" PRIMARY KEY ("id")
);

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

    CONSTRAINT "grievance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "captcha_challenge" (
    "id" TEXT NOT NULL,
    "expected_answer" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "captcha_challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "captcha_config" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "provider" TEXT NOT NULL DEFAULT 'math',
    "difficulty" TEXT NOT NULL DEFAULT 'difficult',
    "expiration_minutes" INTEGER NOT NULL DEFAULT 5,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "adaptive_captcha" BOOLEAN NOT NULL DEFAULT true,
    "show_after_failed_login" INTEGER NOT NULL DEFAULT 3,
    "updt_ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "captcha_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "captcha_audit_log" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ip_address" TEXT,
    "purpose" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "captcha_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "language" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "native_name" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'LTR',
    "flag" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translation_module" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translation_module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translation_key" (
    "id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translation_key_pkey" PRIMARY KEY ("id")
);

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

    CONSTRAINT "translation_value_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translation_history" (
    "id" TEXT NOT NULL,
    "translation_value_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "changed_by" TEXT,
    "change_reason" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "translation_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "module_name" TEXT NOT NULL,
    "entity_name" TEXT,
    "entity_id" TEXT,
    "user_id" TEXT,
    "user_role" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "request_url" TEXT,
    "request_method" TEXT,
    "remarks" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_id" TEXT,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_change" (
    "id" TEXT NOT NULL,
    "audit_log_id" TEXT NOT NULL,
    "field_name" TEXT,
    "old_value" TEXT,
    "new_value" TEXT,
    "json_diff" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_change_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_session" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "status" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_security" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_id" TEXT,
    "request_url" TEXT,
    "payload" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'HIGH',
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_security_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_download" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "file_type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "ip_address" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_download_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_record" (
    "id" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "owner_id" TEXT,
    "tags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "checksum" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_version" (
    "id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL DEFAULT 1,
    "storage_provider" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "bucket" TEXT,
    "mime_type" TEXT NOT NULL,
    "extension" TEXT,
    "size_bytes" BIGINT NOT NULL,
    "checksum" TEXT,
    "entry_by" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_attachment" (
    "id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "module" TEXT,
    "attached_by" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_registry" (
    "id" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_template" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_rule" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "recipient_resolver" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_log" (
    "id" TEXT NOT NULL,
    "event_id" TEXT,
    "recipient_id" TEXT,
    "recipient_contact" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "failure_reason" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preference" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "quiet_hours_start" TEXT,
    "quiet_hours_end" TEXT,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signed_url_log" (
    "id" TEXT NOT NULL,
    "signature_hash" TEXT NOT NULL,
    "url_path" TEXT NOT NULL,
    "entity_id" TEXT,
    "action" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_one_time" BOOLEAN NOT NULL DEFAULT false,
    "is_consumed" BOOLEAN NOT NULL DEFAULT false,
    "consumed_at" TIMESTAMP(3),
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signed_url_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT,
    "description" TEXT,
    "guard_name" TEXT NOT NULL DEFAULT 'web',
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT,
    "description" TEXT,
    "module" TEXT,
    "group" TEXT,
    "guard_name" TEXT NOT NULL DEFAULT 'web',
    "entry_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updt_ts" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_has_permission" (
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_has_permission_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "model_has_role" (
    "role_id" TEXT NOT NULL,
    "model_type" TEXT NOT NULL DEFAULT 'user',
    "model_id" TEXT NOT NULL,

    CONSTRAINT "model_has_role_pkey" PRIMARY KEY ("role_id","model_type","model_id")
);

-- CreateTable
CREATE TABLE "model_has_permission" (
    "permission_id" TEXT NOT NULL,
    "model_type" TEXT NOT NULL DEFAULT 'user',
    "model_id" TEXT NOT NULL,

    CONSTRAINT "model_has_permission_pkey" PRIMARY KEY ("permission_id","model_type","model_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_mobile_key" ON "user"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "user_aadhaar_hash_key" ON "user"("aadhaar_hash");

-- CreateIndex
CREATE UNIQUE INDEX "auth_session_token_key" ON "auth_session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "mst_plot_mouza_id_plot_number_key" ON "mst_plot"("mouza_id", "plot_number");

-- CreateIndex
CREATE UNIQUE INDEX "form_i_claim_citizen_id_hash_plot_id_key" ON "form_i_claim"("citizen_id_hash", "plot_id");

-- CreateIndex
CREATE UNIQUE INDEX "nominee_pool_nominee_aadhaar_hash_key" ON "nominee_pool"("nominee_aadhaar_hash");

-- CreateIndex
CREATE UNIQUE INDEX "nominee_pool_contribution_pool_id_form_i_claim_id_key" ON "nominee_pool_contribution"("pool_id", "form_i_claim_id");

-- CreateIndex
CREATE UNIQUE INDEX "doc_template_template_code_key" ON "doc_template"("template_code");

-- CreateIndex
CREATE UNIQUE INDEX "doc_instance_document_id_key" ON "doc_instance"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "doc_dynamic_answer_instance_id_question_key_key" ON "doc_dynamic_answer"("instance_id", "question_key");

-- CreateIndex
CREATE UNIQUE INDEX "language_code_key" ON "language"("code");

-- CreateIndex
CREATE UNIQUE INDEX "translation_module_name_key" ON "translation_module"("name");

-- CreateIndex
CREATE UNIQUE INDEX "translation_key_module_id_key_key" ON "translation_key"("module_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "translation_value_translation_key_id_language_id_key" ON "translation_value"("translation_key_id", "language_id");

-- CreateIndex
CREATE UNIQUE INDEX "file_record_checksum_key" ON "file_record"("checksum");

-- CreateIndex
CREATE UNIQUE INDEX "file_version_file_id_version_number_key" ON "file_version"("file_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "file_attachment_file_id_entity_type_entity_id_key" ON "file_attachment"("file_id", "entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_registry_event_name_key" ON "event_registry"("event_name");

-- CreateIndex
CREATE UNIQUE INDEX "notification_template_code_key" ON "notification_template"("code");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preference_user_id_channel_key" ON "notification_preference"("user_id", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "signed_url_log_signature_hash_key" ON "signed_url_log"("signature_hash");

-- CreateIndex
CREATE UNIQUE INDEX "role_name_guard_name_key" ON "role"("name", "guard_name");

-- CreateIndex
CREATE UNIQUE INDEX "permission_name_guard_name_key" ON "permission"("name", "guard_name");

-- CreateIndex
CREATE INDEX "model_has_role_model_type_model_id_idx" ON "model_has_role"("model_type", "model_id");

-- CreateIndex
CREATE INDEX "model_has_permission_model_type_model_id_idx" ON "model_has_permission"("model_type", "model_id");

-- AddForeignKey
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mst_plot" ADD CONSTRAINT "mst_plot_mouza_id_fkey" FOREIGN KEY ("mouza_id") REFERENCES "mst_mouza"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "land_schedule" ADD CONSTRAINT "land_schedule_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "mst_project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "land_schedule_item" ADD CONSTRAINT "land_schedule_item_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "land_schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "land_schedule_item" ADD CONSTRAINT "land_schedule_item_plot_id_fkey" FOREIGN KEY ("plot_id") REFERENCES "mst_plot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_i_claim" ADD CONSTRAINT "form_i_claim_plot_id_fkey" FOREIGN KEY ("plot_id") REFERENCES "mst_plot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compensation_payroll" ADD CONSTRAINT "compensation_payroll_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "mst_project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compensation_payroll_line" ADD CONSTRAINT "compensation_payroll_line_payroll_id_fkey" FOREIGN KEY ("payroll_id") REFERENCES "compensation_payroll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paf_census_record" ADD CONSTRAINT "paf_census_record_plot_id_fkey" FOREIGN KEY ("plot_id") REFERENCES "mst_plot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rnr_asset_payroll" ADD CONSTRAINT "rnr_asset_payroll_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "mst_project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rnr_asset_payroll_line" ADD CONSTRAINT "rnr_asset_payroll_line_payroll_id_fkey" FOREIGN KEY ("payroll_id") REFERENCES "rnr_asset_payroll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_d_ledger_entry" ADD CONSTRAINT "form_d_ledger_entry_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "mst_project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_d_ledger_entry" ADD CONSTRAINT "form_d_ledger_entry_plot_id_fkey" FOREIGN KEY ("plot_id") REFERENCES "mst_plot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nominee_pool_contribution" ADD CONSTRAINT "nominee_pool_contribution_pool_id_fkey" FOREIGN KEY ("pool_id") REFERENCES "nominee_pool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nominee_pool_contribution" ADD CONSTRAINT "nominee_pool_contribution_form_i_claim_id_fkey" FOREIGN KEY ("form_i_claim_id") REFERENCES "form_i_claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_application" ADD CONSTRAINT "employment_application_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "mst_project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_application" ADD CONSTRAINT "employment_application_nominee_pool_id_fkey" FOREIGN KEY ("nominee_pool_id") REFERENCES "nominee_pool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doc_instance" ADD CONSTRAINT "doc_instance_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "doc_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doc_version" ADD CONSTRAINT "doc_version_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "doc_instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doc_dynamic_answer" ADD CONSTRAINT "doc_dynamic_answer_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "doc_instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doc_workflow_step" ADD CONSTRAINT "doc_workflow_step_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "doc_instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doc_signature" ADD CONSTRAINT "doc_signature_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "doc_instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "translation_key" ADD CONSTRAINT "translation_key_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "translation_module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "translation_value" ADD CONSTRAINT "translation_value_translation_key_id_fkey" FOREIGN KEY ("translation_key_id") REFERENCES "translation_key"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "translation_value" ADD CONSTRAINT "translation_value_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "translation_history" ADD CONSTRAINT "translation_history_translation_value_id_fkey" FOREIGN KEY ("translation_value_id") REFERENCES "translation_value"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "audit_session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_change" ADD CONSTRAINT "audit_change_audit_log_id_fkey" FOREIGN KEY ("audit_log_id") REFERENCES "audit_log"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_version" ADD CONSTRAINT "file_version_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_attachment" ADD CONSTRAINT "file_attachment_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_rule" ADD CONSTRAINT "notification_rule_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event_registry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_rule" ADD CONSTRAINT "notification_rule_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "notification_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_has_permission" ADD CONSTRAINT "role_has_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_has_permission" ADD CONSTRAINT "role_has_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_has_role" ADD CONSTRAINT "model_has_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_has_permission" ADD CONSTRAINT "model_has_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
