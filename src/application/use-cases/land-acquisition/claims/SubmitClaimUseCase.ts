import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IClaimRepository } from '@/modules/land-acquisition/interfaces/IClaimRepository'
import { IPlotRepository } from '@/domain/entities/plot/IPlotRepository'
import { createHash, randomUUID } from 'crypto'
import { db } from '@/lib/db'

export interface SubmitClaimDTO {
  // Auth & Identity
  authType?: 'aadhaar' | 'epic'
  aadhaarNumber?: string
  epicNo?: string

  // Q1-Q7 Personal Details
  claimant_name?: string
  father_husband_name?: string
  present_address?: string
  permanent_address?: string
  occupation?: string
  gender?: string
  nationality?: string
  religion?: string
  caste_category?: string
  primary_mobile_no?: string
  photo_doc_id?: string

  // Q8 Plot Schedule
  plot_id?: string
  khatian_no?: string
  own_share_acres?: string
  link_deed_no?: string
  ownership_date?: string
  transferor_name?: string
  acquisition_mode_offered?: string

  // Q9-Q15 Statutory Declarations & Bank
  prior_compensation_received?: boolean
  prior_compensation_details?: string
  bank_name?: string
  bank_branch?: string
  bank_account_number?: string
  bank_ifsc?: string
  passbook_doc_id?: string
  prior_employment_linked?: boolean
  prior_employment_details?: string
  is_free_from_disputes?: boolean
  dispute_details?: string
  is_free_from_encumbrances?: boolean
  encumbrance_details?: string
  can_handover_possession?: boolean
  possession_reason?: string
  opted_monetary_in_lieu_of_employment?: boolean
  monetary_opt_reason?: string

  magistrate_affidavit_doc_id?: string
  title_deed_doc_id?: string
}

export class SubmitClaimUseCase implements IUseCase<SubmitClaimDTO, any> {
  constructor(
    private claimRepository: IClaimRepository,
    private plotRepository: IPlotRepository
  ) {}

  async execute(req: SubmitClaimDTO): Promise<Result<any>> {
    try {
      if (!req.claimant_name || !req.plot_id || !req.own_share_acres) {
        return Fail('claimant_name, plot_id, own_share_acres are required')
      }

      let citizen_id_hash = ''
      const epic_no = req.epicNo ? req.epicNo.trim().toUpperCase() : null

      if (req.aadhaarNumber && req.aadhaarNumber.trim()) {
        citizen_id_hash = createHash('sha256').update(req.aadhaarNumber.trim()).digest('hex').slice(0, 16)
      } else if (epic_no) {
        citizen_id_hash = createHash('sha256').update(`EPIC:${epic_no}`).digest('hex').slice(0, 16)
      } else {
        return Fail('Either Aadhaar Number or Voter EPIC Number is required for identity verification')
      }

      // Query acquisition.plot_schedule via plotRepository
      const plot = await this.plotRepository.findById(req.plot_id)
      if (!plot) return Fail('Selected plot not found in approved acquisition schedule')

      const ownShare = Number(req.own_share_acres)
      const maxPlotArea = Number(plot.area_acres)
      if (ownShare <= 0) return Fail('Own share must be greater than 0 acres')
      if (maxPlotArea > 0 && ownShare > maxPlotArea) {
        return Fail(`Own share (${ownShare} acres) exceeds plot acquired area (${maxPlotArea} acres)`)
      }

      // Prevent duplicate claim by same land loser on same plot
      const existing = await this.claimRepository.findByCitizenAndPlot(citizen_id_hash, req.plot_id)
      if (existing) return Fail('A Form-I claim already exists for this citizen on this plot')

      // Upsert Land Loser Master Profile for returning citizen detection
      await db.land_loser_master.upsert({
        where: { citizen_id_hash },
        update: {
          epic_no: epic_no || undefined,
          full_name: req.claimant_name,
          father_husband_name: req.father_husband_name || '',
          present_address: req.present_address || '',
          permanent_address: req.permanent_address || '',
          occupation: req.occupation,
          gender: req.gender,
          nationality: req.nationality || 'Indian',
          religion: req.religion,
          caste_category: req.caste_category,
          primary_mobile_no: req.primary_mobile_no,
          bank_name: req.bank_name,
          bank_branch: req.bank_branch,
          bank_account_number: req.bank_account_number,
          bank_ifsc: req.bank_ifsc,
          photo_doc_id: req.photo_doc_id,
          updt_ts: new Date(),
        },
        create: {
          citizen_id_hash,
          epic_no,
          full_name: req.claimant_name,
          father_husband_name: req.father_husband_name || 'N/A',
          present_address: req.present_address || 'N/A',
          permanent_address: req.permanent_address || 'N/A',
          occupation: req.occupation,
          gender: req.gender,
          nationality: req.nationality || 'Indian',
          religion: req.religion,
          caste_category: req.caste_category,
          primary_mobile_no: req.primary_mobile_no,
          bank_name: req.bank_name,
          bank_branch: req.bank_branch,
          bank_account_number: req.bank_account_number,
          bank_ifsc: req.bank_ifsc,
          photo_doc_id: req.photo_doc_id,
        },
      })

      const claim_code = `FORM1-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`
      const submitted_at = new Date()
      const transparency_window_ends_at = new Date(submitted_at.getTime() + 21 * 86400000)
      const form_v_eligible = ownShare >= 2.0

      const claim = await this.claimRepository.create({
        id: randomUUID(),
        claim_code,
        plot_id: req.plot_id,
        citizen_id_hash,
        epic_no,
        claimant_name: req.claimant_name,
        father_husband_name: req.father_husband_name,
        present_address: req.present_address,
        permanent_address: req.permanent_address,
        occupation: req.occupation,
        gender: req.gender,
        nationality: req.nationality || 'Indian',
        religion: req.religion,
        caste_category: req.caste_category,
        photo_doc_id: req.photo_doc_id,

        khatian_no: req.khatian_no,
        own_share_acres: req.own_share_acres,
        link_deed_no: req.link_deed_no,
        ownership_date: req.ownership_date ? new Date(req.ownership_date) : null,
        transferor_name: req.transferor_name,
        acquisition_mode_offered: req.acquisition_mode_offered || 'CBA_ACT',

        prior_compensation_received: req.prior_compensation_received ?? false,
        prior_compensation_details: req.prior_compensation_details,
        bank_name: req.bank_name,
        bank_branch: req.bank_branch,
        bank_account_number: req.bank_account_number,
        bank_ifsc: req.bank_ifsc,
        passbook_doc_id: req.passbook_doc_id,

        prior_employment_linked: req.prior_employment_linked ?? false,
        prior_employment_details: req.prior_employment_details,
        is_free_from_disputes: req.is_free_from_disputes ?? true,
        dispute_details: req.dispute_details,
        is_free_from_encumbrances: req.is_free_from_encumbrances ?? true,
        encumbrance_details: req.encumbrance_details,
        can_handover_possession: req.can_handover_possession ?? true,
        possession_reason: req.possession_reason,
        opted_monetary_in_lieu_of_employment: req.opted_monetary_in_lieu_of_employment ?? false,
        monetary_opt_reason: req.monetary_opt_reason,
        form_v_eligible,

        magistrate_affidavit_doc_id: req.magistrate_affidavit_doc_id,
        title_deed_doc_id: req.title_deed_doc_id,

        state: 'TitleScrutiny',
        submitted_at,
        transparency_window_ends_at,
      })

      return Ok({
        id: claim.id,
        claim_code: claim.claim_code,
        state: claim.state,
        form_v_eligible: claim.form_v_eligible,
        submitted_at: claim.submitted_at!.toISOString(),
        transparency_window_ends_at: claim.transparency_window_ends_at!.toISOString(),
      })
    } catch (error: any) {
      return Fail(error.message || 'Failed to submit claim')
    }
  }
}
