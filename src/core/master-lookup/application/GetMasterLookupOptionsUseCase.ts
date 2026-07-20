import { IMasterLookupRepository } from '../domain/IMasterLookupRepository'
import { MasterOption } from '../types'
import { Result, Ok, Fail } from '@/core/result/Result'
import { MASTER_REGISTRY } from '@/modules/admin/master-data/config/MasterDataRegistry'

export interface GetMasterLookupRequest {
  table: string
  searchParams: URLSearchParams
}

export class GetMasterLookupOptionsUseCase {
  constructor(private readonly repository: IMasterLookupRepository) {}

  async execute(request: GetMasterLookupRequest): Promise<Result<MasterOption[]>> {
    const config = MASTER_REGISTRY[request.table]
    
    if (!config) {
      return Fail('Master table not found')
    }

    // Determine label and value fields
    const valueField = config.primaryKey
    // Pick the first string column as the label (if exists), otherwise fallback to the primary key
    const stringCol = config.columns.find(c => c.type === 'string' && !c.key.includes('_lgd'))
    const labelField = stringCol ? stringCol.key : valueField

    const searchParams = request.searchParams
    const activeOnly = searchParams.get('activeOnly') === 'true'
    const searchQuery = searchParams.get('search') || undefined

    const dependencies: Record<string, string | number> = {}

    // Extract dynamic dependencies, validating against the columns registry
    searchParams.forEach((val, key) => {
      // Ignore known query parameters
      if (key === 'search' || key === 'activeOnly') return

      const validColumn = config.columns.find(c => c.key === key)
      if (validColumn) {
        dependencies[key] = validColumn.type === 'number' ? Number(val) : val
      }
    })

    // Remove is_active dependency if table doesn't support it
    const hasIsActive = config.columns.find(c => c.key === 'is_active')
    const finalActiveOnly = activeOnly && !!hasIsActive

    try {
      const options = await this.repository.findOptions({
        master: config.modelName,
        labelField,
        valueField,
        dependencies: Object.keys(dependencies).length > 0 ? dependencies : undefined,
        searchQuery,
        activeOnly: finalActiveOnly,
      })

      // Resolve labels for any pre-selected values that might have been filtered out
      const requestedValues = searchParams.get('values')
      if (requestedValues) {
        const valuesList = requestedValues.split(',').map(v => v.trim()).filter(Boolean)
        const missingValues = valuesList.filter(v => !options.some(opt => opt.value === v))

        if (missingValues.length > 0) {
          const missingOptions = await this.repository.findOptionsByValues({
            master: config.modelName,
            labelField,
            valueField,
            values: missingValues
          })

          // Prepend missing options (or append, but prepending is often good for selected items)
          options.unshift(...missingOptions)
        }
      }

      return Ok(options)
    } catch (error: any) {
      console.error(`[GetMasterLookupOptionsUseCase] DB Error:`, error)
      return Fail('Internal database error occurred while fetching lookup options')
    }
  }
}
