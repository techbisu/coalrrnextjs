import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result } from '@/core/result/Result'
import { INomineePoolRepository } from '@/modules/employment/interfaces/INomineePoolRepository'
import { dec } from '@/app/api/_lib'

export class GetNomineePoolDetailUseCase implements IUseCase<{ id: string }, any> {
  constructor(private poolRepository: INomineePoolRepository) {}

  async execute(request: { id: string }): Promise<Result<any>> {
    try {
      const pool = await this.poolRepository.findPoolById(request.id)
      
      if (!pool) {
        return Result.fail('Nominee pool not found') // Can use a specific error type later
      }

      const pooledAcres = Number(pool.pooled_acreage)
      const hasCrossedThreshold = pooledAcres >= 2.0
      let status = 'Pooling'
      if (pool.employment_applications && pool.employment_applications.length > 0) status = 'Application Submitted'
      else if (hasCrossedThreshold) status = 'Threshold Met'

      const result = {
        id: pool.id,
        nominee_name: pool.nominee_name,
        nominee_aadhaar_hash: pool.nominee_aadhaar_hash,
        pooled_acreage: dec(pool.pooled_acreage),
        threshold: '2.0',
        hasCrossedThreshold,
        contributionCount: pool.contributions?.length ?? 0,
        status,
        contributions: (pool.contributions || []).map((c: any) => ({
          id: c.id,
          claimant_name: c.form_i_claim?.claimant_name,
          plot_number: c.form_i_claim?.plot?.plot_number,
          share_acres: dec(c.share_acres),
          claim_code: c.form_i_claim?.claim_code
        })),
        entry_ts: pool.entry_ts.toISOString()
      }

      return Result.ok(result)
    } catch (error: any) {
      return Result.fail(error.message)
    }
  }
}
