import { PrismaDocumentInstanceRepository } from '@/modules/document-engine/infrastructure/persistence/PrismaDocumentInstanceRepository'
import { PrismaDocumentTemplateRepository } from '@/modules/document-engine/infrastructure/persistence/PrismaDocumentTemplateRepository'
import { StartDocumentWorkspaceUseCase } from '@/modules/document-engine/application/use-cases/StartDocumentWorkspaceUseCase'
import { SaveDocumentFormUseCase } from '@/modules/document-engine/application/use-cases/SaveDocumentFormUseCase'
import { GenerateDocumentUseCase } from '@/modules/document-engine/application/use-cases/GenerateDocumentUseCase'
import { ResolverRegistry } from '@/modules/document-engine/application/ResolverRegistry'
import { PrismaDocumentQueryService } from '@/modules/document-engine/infrastructure/persistence/PrismaDocumentQueryService'

const globalForDocEngineDI = globalThis as unknown as {
  startDocumentWorkspaceUseCase: StartDocumentWorkspaceUseCase | undefined
  saveDocumentFormUseCase: SaveDocumentFormUseCase | undefined
  generateDocumentUseCase: GenerateDocumentUseCase | undefined
}

const documentInstanceRepository = new PrismaDocumentInstanceRepository()
const documentTemplateRepository = new PrismaDocumentTemplateRepository()
const documentQueryService = new PrismaDocumentQueryService()
const resolverRegistry = new ResolverRegistry(documentQueryService)

export const startDocumentWorkspaceUseCase = globalForDocEngineDI.startDocumentWorkspaceUseCase ?? new StartDocumentWorkspaceUseCase(
  documentInstanceRepository,
  documentTemplateRepository,
  resolverRegistry
)

export const saveDocumentFormUseCase = globalForDocEngineDI.saveDocumentFormUseCase ?? new SaveDocumentFormUseCase(
  documentInstanceRepository
)

export const generateDocumentUseCase = globalForDocEngineDI.generateDocumentUseCase ?? new GenerateDocumentUseCase(
  documentInstanceRepository,
  documentTemplateRepository,
  resolverRegistry
)

if (process.env.NODE_ENV !== 'production') {
  globalForDocEngineDI.startDocumentWorkspaceUseCase = startDocumentWorkspaceUseCase
  globalForDocEngineDI.saveDocumentFormUseCase = saveDocumentFormUseCase
  globalForDocEngineDI.generateDocumentUseCase = generateDocumentUseCase
}
