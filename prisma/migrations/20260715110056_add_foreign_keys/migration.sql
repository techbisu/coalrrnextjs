-- AddForeignKey
ALTER TABLE "audit_change" ADD CONSTRAINT "audit_change_audit_log_id_fkey" FOREIGN KEY ("audit_log_id") REFERENCES "audit_log"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "audit_session"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "compensation_payroll" ADD CONSTRAINT "compensation_payroll_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "mst_project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "compensation_payroll_line" ADD CONSTRAINT "compensation_payroll_line_payroll_id_fkey" FOREIGN KEY ("payroll_id") REFERENCES "compensation_payroll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "document_instance" ADD CONSTRAINT "document_instance_template_code_fkey" FOREIGN KEY ("template_code") REFERENCES "document_template"("template_code") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "document_template_field" ADD CONSTRAINT "document_template_field_template_code_fkey" FOREIGN KEY ("template_code") REFERENCES "document_template"("template_code") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "employment_application" ADD CONSTRAINT "employment_application_nominee_pool_id_fkey" FOREIGN KEY ("nominee_pool_id") REFERENCES "nominee_pool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "employment_application" ADD CONSTRAINT "employment_application_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "mst_project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "file_attachment" ADD CONSTRAINT "file_attachment_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "file_version" ADD CONSTRAINT "file_version_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "form_d_ledger_entry" ADD CONSTRAINT "form_d_ledger_entry_plot_id_fkey" FOREIGN KEY ("plot_id") REFERENCES "mst_plot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "form_d_ledger_entry" ADD CONSTRAINT "form_d_ledger_entry_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "mst_project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "form_i_claim" ADD CONSTRAINT "form_i_claim_plot_id_fkey" FOREIGN KEY ("plot_id") REFERENCES "mst_plot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "land_schedule" ADD CONSTRAINT "land_schedule_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "mst_project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "land_schedule_item" ADD CONSTRAINT "land_schedule_item_plot_id_fkey" FOREIGN KEY ("plot_id") REFERENCES "mst_plot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "land_schedule_item" ADD CONSTRAINT "land_schedule_item_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "land_schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "model_has_permission" ADD CONSTRAINT "model_has_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "model_has_role" ADD CONSTRAINT "model_has_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "mst_plot" ADD CONSTRAINT "mst_plot_mouza_lgd_fkey" FOREIGN KEY ("mouza_lgd") REFERENCES "master"."mouza_master"("mouza_lgd") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "nominee_pool_contribution" ADD CONSTRAINT "nominee_pool_contribution_form_i_claim_id_fkey" FOREIGN KEY ("form_i_claim_id") REFERENCES "form_i_claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "nominee_pool_contribution" ADD CONSTRAINT "nominee_pool_contribution_pool_id_fkey" FOREIGN KEY ("pool_id") REFERENCES "nominee_pool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "notification_rule" ADD CONSTRAINT "notification_rule_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event_registry"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "notification_rule" ADD CONSTRAINT "notification_rule_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "notification_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "paf_census_record" ADD CONSTRAINT "paf_census_record_plot_id_fkey" FOREIGN KEY ("plot_id") REFERENCES "mst_plot"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "rnr_asset_payroll" ADD CONSTRAINT "rnr_asset_payroll_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "mst_project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "rnr_asset_payroll_line" ADD CONSTRAINT "rnr_asset_payroll_line_payroll_id_fkey" FOREIGN KEY ("payroll_id") REFERENCES "rnr_asset_payroll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "role_has_permission" ADD CONSTRAINT "role_has_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "role_has_permission" ADD CONSTRAINT "role_has_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "translation_history" ADD CONSTRAINT "translation_history_translation_value_id_fkey" FOREIGN KEY ("translation_value_id") REFERENCES "translation_value"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "translation_key" ADD CONSTRAINT "translation_key_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "translation_module"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "translation_value" ADD CONSTRAINT "translation_value_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "language"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "translation_value" ADD CONSTRAINT "translation_value_translation_key_id_fkey" FOREIGN KEY ("translation_key_id") REFERENCES "translation_key"("id") ON DELETE CASCADE ON UPDATE CASCADE;

