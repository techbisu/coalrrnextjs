import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

export interface LookupLandLoserDTO {
  authType: 'aadhaar' | 'epic'
  identifier: string
}

export class LookupLandLoserProfileUseCase implements IUseCase<LookupLandLoserDTO, any> {
  async execute(req: LookupLandLoserDTO): Promise<Result<any>> {
    try {
      if (!req.identifier) {
        return Fail('Identifier is required')
      }

      let profile: any = null

      if (req.authType === 'aadhaar') {
        const citizen_id_hash = createHash('sha256').update(req.identifier.trim()).digest('hex').slice(0, 16)
        profile = await db.land_loser_master.findUnique({
          where: { citizen_id_hash },
        })
      } else {
        profile = await db.land_loser_master.findUnique({
          where: { epic_no: req.identifier.trim().toUpperCase() },
        })
      }

      if (!profile) {
        return Ok({ exists: false })
      }

      return Ok({
        exists: true,
        profile: {
          citizen_id_hash: profile.citizen_id_hash,
          epic_no: profile.epic_no,
          full_name: profile.full_name,
          father_husband_name: profile.father_husband_name,
          present_address: profile.present_address,
          permanent_address: profile.permanent_address,
          occupation: profile.occupation,
          gender: profile.gender,
          nationality: profile.nationality,
          religion: profile.religion,
          caste_category: profile.caste_category,
          primary_mobile_no: profile.primary_mobile_no,
          bank_name: profile.bank_name,
          bank_branch: profile.bank_branch,
          bank_account_number: profile.bank_account_number,
          bank_ifsc: profile.bank_ifsc,
          photo_doc_id: profile.photo_doc_id,
        },
      })
    } catch (error: any) {
      return Fail(error.message || 'Failed to lookup Land Loser profile')
    }
  }
}
