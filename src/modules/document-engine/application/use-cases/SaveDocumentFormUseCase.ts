import { IUseCase } from '@/core/interfaces/UseCase.interface'
import { Result, Ok, Fail } from '@/core/result/Result'
import { IDocumentInstanceRepository } from '../../domain/IDocumentInstanceRepository'

export interface SaveDocumentFormDTO {
  instanceId: string
  formData: Record<string, any>
  userId?: string
}

export class SaveDocumentFormUseCase implements IUseCase<SaveDocumentFormDTO, any> {
  constructor(private readonly instanceRepository: IDocumentInstanceRepository) {}

  async execute(request: SaveDocumentFormDTO): Promise<Result<any>> {
    try {
      const { instanceId, formData, userId = 'system' } = request

      const instance = await this.instanceRepository.update(instanceId, {
        form_data: formData
      })

      await this.instanceRepository.addAuditLog({
        document_instance_id: instanceId,
        action: 'FORM_SAVED',
        user_id: userId,
        user_name: 'System',
        role: null,
        ip_address: null,
        browser: null
      })

      return Ok(instance)
    } catch (error: any) {
      return Fail(error.message)
    }
  }
}
