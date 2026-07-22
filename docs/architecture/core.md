# core Module

## Purpose
This module is responsible for the core layer of the application. It encapsulates logic, components, and services specific to this domain.

## File-by-file breakdown
| File | Description |
|------|-------------|
| `core/audit/components/ActivityTimeline.tsx` | React component for ActivityTimeline. |
| `core/audit/components/AuditDiffViewer.tsx` | React component for AuditDiffViewer. |
| `core/audit/components/AuditGrid.tsx` | React component for AuditGrid. |
| `core/audit/components/EntityHistory.tsx` | React component for EntityHistory. |
| `core/audit/components/index.ts` | Provides functionality related to index. |
| `core/audit/extensions/PrismaAuditExtension.ts` | Provides functionality related to PrismaAuditExtension. |
| `core/audit/index.ts` | Provides functionality related to index. |
| `core/audit/repositories/AuditRepository.ts` | Handles database operations for Audit. |
| `core/audit/services/AuditService.ts` | Encapsulates domain logic for Audit. |
| `core/audit/types/index.ts` | Provides functionality related to index. |
| `core/audit/utils/AuditEventBuilder.ts` | Provides functionality related to AuditEventBuilder. |
| `core/audit/utils/diff.ts` | Provides functionality related to diff. |
| `core/authorization/cache/PermissionCache.ts` | Provides functionality related to PermissionCache. |
| `core/authorization/components/Can.tsx` | React component for Can. |
| `core/authorization/components/CanAny.tsx` | React component for CanAny. |
| `core/authorization/components/Cannot.tsx` | React component for Cannot. |
| `core/authorization/components/index.ts` | Provides functionality related to index. |
| `core/authorization/components/RoleGuard.tsx` | React component for RoleGuard. |
| `core/authorization/hooks/index.ts` | Provides functionality related to index. |
| `core/authorization/hooks/usePermission.ts` | Provides functionality related to usePermission. |
| `core/authorization/hooks/useRole.ts` | Provides functionality related to useRole. |
| `core/authorization/index.ts` | Provides functionality related to index. |
| `core/authorization/interfaces/IPermissionRepository.ts` | Handles database operations for IPermission. |
| `core/authorization/interfaces/IRoleRepository.ts` | Handles database operations for IRole. |
| `core/authorization/middleware/authorize.ts` | Provides functionality related to authorize. |
| `core/authorization/policies/index.ts` | Provides functionality related to index. |
| `core/authorization/policies/PolicyEngine.ts` | Provides functionality related to PolicyEngine. |
| `core/authorization/policies/ProposalPolicy.ts` | Provides functionality related to ProposalPolicy. |
| `core/authorization/providers/AuthorizationProvider.tsx` | React component for AuthorizationProvider. |
| `core/authorization/providers/AuthProvider.tsx` | React component for AuthProvider. |
| `core/authorization/seed/seedRolesAndPermissions.ts` | Provides functionality related to seedRolesAndPermissions. |
| `core/authorization/services/AuthorizationService.ts` | Encapsulates domain logic for Authorization. |
| `core/authorization/services/PermissionService.ts` | Encapsulates domain logic for Permission. |
| `core/authorization/services/RoleService.ts` | Encapsulates domain logic for Role. |
| `core/authorization/services/UserScopeService.ts` | Encapsulates domain logic for UserScope. |
| `core/authorization/types/index.ts` | Provides functionality related to index. |
| `core/authorization/validators/index.ts` | Provides functionality related to index. |
| `core/base/AggregateRoot.ts` | Provides functionality related to AggregateRoot. |
| `core/base/DomainEvent.ts` | Provides functionality related to DomainEvent. |
| `core/base/Entity.ts` | Provides functionality related to Entity. |
| `core/base/index.ts` | Provides functionality related to index. |
| `core/base/ValueObject.ts` | Provides functionality related to ValueObject. |
| `core/context/RequestContext.ts` | Provides functionality related to RequestContext. |
| `core/errors/DomainException.ts` | Provides functionality related to DomainException. |
| `core/errors/index.ts` | Provides functionality related to index. |
| `core/errors/NotFoundException.ts` | Provides functionality related to NotFoundException. |
| `core/errors/UnauthorizedException.ts` | Provides functionality related to UnauthorizedException. |
| `core/errors/ValidationException.ts` | Provides functionality related to ValidationException. |
| `core/event-bus/IEventBus.ts` | Provides functionality related to IEventBus. |
| `core/event-bus/index.ts` | Provides functionality related to index. |
| `core/event-bus/LocalEventBus.ts` | Provides functionality related to LocalEventBus. |
| `core/index.ts` | Provides functionality related to index. |
| `core/interfaces/index.ts` | Provides functionality related to index. |
| `core/interfaces/Repository.interface.ts` | Provides functionality related to Repository. |
| `core/interfaces/UseCase.interface.ts` | Provides functionality related to UseCase. |
| `core/jobs/JobQueue.ts` | Provides functionality related to JobQueue. |
| `core/master-lookup/application/GetMasterLookupOptionsUseCase.ts` | Orchestrates business logic for GetMasterLookupOptions. |
| `core/master-lookup/components/MasterAutocomplete.tsx` | React component for MasterAutocomplete. |
| `core/master-lookup/components/MasterCascade.tsx` | React component for MasterCascade. |
| `core/master-lookup/components/MasterFormLookup.tsx` | React component for MasterFormLookup. |
| `core/master-lookup/components/MasterLookup.tsx` | React component for MasterLookup. |
| `core/master-lookup/domain/IMasterLookupRepository.ts` | Handles database operations for IMasterLookup. |
| `core/master-lookup/hooks/useMasterQuery.ts` | Provides functionality related to useMasterQuery. |
| `core/master-lookup/index.ts` | Provides functionality related to index. |
| `core/master-lookup/infrastructure/PrismaMasterLookupRepository.ts` | Handles database operations for PrismaMasterLookup. |
| `core/master-lookup/types/index.ts` | Provides functionality related to index. |
| `core/notifications/EventBus.ts` | Provides functionality related to EventBus. |
| `core/notifications/interfaces/INotificationStorage.ts` | Provides functionality related to INotificationStorage. |
| `core/notifications/NotificationConfig.ts` | Provides functionality related to NotificationConfig. |
| `core/notifications/providers/MockProviders.ts` | Provides functionality related to MockProviders. |
| `core/notifications/providers/ProviderInterface.ts` | Provides functionality related to ProviderInterface. |
| `core/notifications/RuleEngine.ts` | Provides functionality related to RuleEngine. |
| `core/notifications/services/ChannelRouter.ts` | Provides functionality related to ChannelRouter. |
| `core/notifications/services/NotificationQueue.ts` | Provides functionality related to NotificationQueue. |
| `core/notifications/services/RecipientResolver.ts` | Provides functionality related to RecipientResolver. |
| `core/notifications/services/TemplateEngine.ts` | Provides functionality related to TemplateEngine. |
| `core/notifications/types.ts` | Provides functionality related to types. |
| `core/result/Result.ts` | Provides functionality related to Result. |
| `core/storage/index.ts` | Provides functionality related to index. |
| `core/storage/IStorageProvider.ts` | Provides functionality related to IStorageProvider. |
| `core/storage/LocalStorageProvider.ts` | Provides functionality related to LocalStorageProvider. |
| `core/validation/schemas/documentUpload.schema.ts` | Provides functionality related to documentUpload. |
| `core/validation/schemas/permission.schema.ts` | Provides functionality related to permission. |
| `core/validation/schemas/role.schema.ts` | Provides functionality related to role. |
| `core/validation/schemas/user.schema.ts` | Provides functionality related to user. |
| `core/workflow/engine.ts` | Provides functionality related to engine. |
| `core/workflow/events.ts` | Provides functionality related to events. |
| `core/workflow/guards.ts` | Provides functionality related to guards. |
| `core/workflow/index.ts` | Provides functionality related to index. |
| `core/workflow/states.ts` | Provides functionality related to states. |
| `core/workflow/types.ts` | Provides functionality related to types. |

## Key dependencies
**Internal Modules:**
- `components`
- `authorization`
- `infrastructure`
- `lib`
- `app`
- `modules`

**External Packages:**
- `react`
- `@prisma/client`
- `crypto`
- `@tanstack/react-query`
- `zod`
- `async_hooks`
- `events`
- `uuid`
- `react-hook-form`
- `lucide-react`
- ...and 2 more.

## Entry points
- `core/interfaces/UseCase.interface.ts`
- `core/master-lookup/application/GetMasterLookupOptionsUseCase.ts`
