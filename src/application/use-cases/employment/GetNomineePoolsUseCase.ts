import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result } from '@/core/result/Result'
import { INomineePoolRepository } from '@/modules/employment/interfaces/INomineePoolRepository'
import { dec } from '@/app/api/_lib'

export class GetNomineePoolsUseCase implements IUseCase<void, any[]> {
  constructor(private poolRepository: INomineePoolRepository) {}

  async execute(): Promise<Result<any[]>> {
    try {
      const pools = await this.poolRepository.findAllPools()

      const result = pools.map((p) => {
        const pooledAcres = Number(p.pooled_acreage)
        const hasCrossedThreshold = pooledAcres >= 2.0
        let status = 'Pooling'
        if (p.employment_applications && p.employment_applications.length > 0) status = 'Application Submitted'
        else if (hasCrossedThreshold) status = 'Threshold Met'

        return {
          id: p.id,
          nominee_name: p.nominee_name,
          nominee_aadhaar_hash: p.nominee_aadhaar_hash,
          pooled_acreage: dec(p.pooled_acreage),
          contributionCount: p._count?.contributions ?? 0,
          status,
          threshold: '2.0',
          hasCrossedThreshold,
          entry_ts: p.entry_ts.toISOString()
        }
      })

      return Result.ok(result)
    } catch (error: any) {
      return Result.fail(error.message)
    }
  }
}
