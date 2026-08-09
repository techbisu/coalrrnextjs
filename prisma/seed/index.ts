import { PrismaClient } from '@prisma/client'
import { seedSysConfig } from './sys_config.seed'
import { seedTranslations } from './translations.seed'
import { seedUsers } from './user.seed'
import { seedRole } from './role.seed'
import { seedEventRegistry } from './event_registry.seed'
import { seedNotificationTemplate } from './notification_template.seed'
import { seedNotificationRule } from './notification_rule.seed'
import { seedAuthOtpNotifications } from './seed-auth-otp-notification'
import { seedTenant } from './tenant.seed'
import { seedProject } from './project.seed'
import { seedProjAprv } from './proj_aprv.seed'
import { seedProjAprvLocation } from './proj_aprv_location.seed'
import { seedFormIClaim } from './form_i_claim.seed'
import { seedCompensationPayroll } from './compensation_payroll.seed'
import { seedLandSchedule } from './land_schedule.seed'
import { seedWorkflowReviewTask } from './workflow_review_task.seed'
import { seedFormDLedgerEntry } from './form_d_ledger_entry.seed'
import { seedNomineePool } from './nominee_pool.seed'
import { seedPafCensusRecord } from './paf_census_record.seed'
import { seedRnrAssetPayroll } from './rnr_asset_payroll.seed'
import { seedEmploymentApplication } from './employment_application.seed'
import { seedGrievance } from './grievance.seed'
import { seedAcquMode } from './acqu_mode.seed'
import { seedCaptchaConfig } from './captcha_config.seed'
import { seedProposalChecklist } from './proposal_checklist.seed'
import { seedWorkflowStates } from './workflow_states.seed'
import { seedWorkflowTransitions } from './workflow_transitions.seed'
import { seedWorkflowActionHistory } from './workflow_action_history.seed'
import { seedDocumentTemplateSignature } from './document_template_signature.seed'

const db = new PrismaClient()

async function main() {
  console.log('🌱 COALRR Master Seed Orchestrator')
  console.log('-----------------------------------')

  try {
    // 1. Core configs and lookups
    await seedSysConfig(db)
    await seedTranslations(db)
    await seedCaptchaConfig(db)
    await seedAcquMode(db)
    await seedProposalChecklist(db)
    await seedWorkflowStates(db)
    await seedWorkflowTransitions(db)
    await seedDocumentTemplateSignature(db)
    await seedWorkflowActionHistory(db)
    
    // 2. Master Data
    await seedTenant(db)
    // await seedProject(db)
    // await seedProjAprv(db)
    // await seedProjAprvLocation(db)
    
    // 3. IAM (Users & Roles)
    await seedUsers(db)
    await seedRole(db)
    
    // 4. Events & Notifications
    await seedEventRegistry(db)
    // await seedNotificationTemplate(db)
    // await seedNotificationRule(db)
    await seedAuthOtpNotifications(db)

    // 5. Operational Data (Order matters for FKs)
    // await seedFormIClaim(db)
    // await seedCompensationPayroll(db)
    // await seedLandSchedule(db)
    // await seedWorkflowReviewTask(db)
    // await seedFormDLedgerEntry(db)
    // await seedNomineePool(db)
    // await seedPafCensusRecord(db)
    // await seedRnrAssetPayroll(db)
    // await seedEmploymentApplication(db)
    // await seedGrievance(db)

    console.log('\n✅ All seeds completed successfully.')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

if (require.main === module) {
  main()
}
