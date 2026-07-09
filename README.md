# 🏛️ COALRR Platform - Enterprise Architecture

**Version:** 0.2.0  
**Architecture:** Clean Architecture + DDD  
**Last Updated:** 2026-07-09

---

## 🎯 Overview

The COALRR (Coal Land Acquisition, Rehabilitation & Resettlement) platform has been refactored to follow enterprise-grade architectural patterns, making it suitable for government, banking, and large-scale organizational deployments.

### Key Improvements

✅ **Clean Architecture** - Clear separation of concerns across layers  
✅ **Domain-Driven Design** - Business logic encapsulated in domain entities  
✅ **SOLID Principles** - Maintainable and extensible codebase  
✅ **Type Safety** - Full TypeScript with branded types  
✅ **Testing Infrastructure** - Comprehensive testing framework  
✅ **Security** - Rate limiting, validation, proper authorization  
✅ **Performance** - Optimized queries, caching ready  

---

## 📁 Project Structure

```
coalrrnextjs/
├── src/
│   ├── core/                    # Core layer (shared kernel)
│   │   ├── base/                # Base classes
│   │   ├── result/              # Result pattern
│   │   ├── errors/              # Exception hierarchy
│   │   └── interfaces/          # Contracts
│   │
│   ├── domain/                  # Domain layer (business logic)
│   │   ├── value-objects/       # Money, Area, etc.
│   │   └── entities/            # Project, Proposal, etc.
│   │
│   ├── infrastructure/          # Infrastructure layer
│   │   ├── persistence/         # Repositories
│   │   └── security/            # Rate limiting, etc.
│   │
│   ├── application/             # Application layer
│   │   ├── use-cases/           # Business operations
│   │   ├── validators/          # Zod schemas
│   │   └── middleware/          # Validation helpers
│   │
│   ├── shared/                  # Cross-cutting concerns
│   │   ├── authorization/       # RBAC
│   │   ├── audit/               # Audit logging
│   │   ├── localization/        # i18n
│   │   ├── notifications/       # Multi-channel notifications
│   │   ├── documents/           # Document engine
│   │   └── workflow/            # State machine
│   │
│   ├── ui/                      # Presentation components
│   │   ├── components/          # Reusable UI
│   │   ├── features/            # Feature-specific
│   │   └── hooks/               # React hooks
│   │
│   └── app/                     # Next.js App Router
│       └── api/                 # API routes
│
├── tests/                       # Test suite
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── setup.ts                 # Test configuration
│
├── prisma/                      # Database
│   └── schema.prisma
│
├── docs/                        # Documentation
│
└── Configuration Files
    ├── package.json
    ├── tsconfig.json
    ├── vitest.config.ts
    └── next.config.ts
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or bun

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run with UI
npm run test:ui
```

---

## 📖 Documentation

### Essential Reading

1. **[ARCHITECTURE_REFACTORING_SUMMARY.md](./ARCHITECTURE_REFACTORING_SUMMARY.md)**
   - Complete refactoring summary
   - What was fixed and why
   - Architecture scores and improvements
   - Migration strategy
   - Next steps

2. **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)**
   - Step-by-step implementation patterns
   - Code examples
   - Common tasks
   - Troubleshooting

### Architecture Layers

#### 1. Core Layer (`src/core/`)

Shared kernel used by all other layers.

**Key Components:**
- `Entity<T>` - Base class for entities with identity
- `ValueObject<T>` - Immutable value objects
- `AggregateRoot<T>` - Root entities with domain events
- `Result<T, E>` - Functional error handling
- Exception hierarchy (DomainException, ValidationException, etc.)

#### 2. Domain Layer (`src/domain/`)

Business logic - completely framework-independent.

**Example:**
```typescript
// Rich domain model with business logic
export class Project extends AggregateRoot<string> {
  lock(userId: string): Result<void, ProjectAlreadyLockedException> {
    if (this._lockedAt !== null) {
      return Fail(new ProjectAlreadyLockedException(this.id))
    }
    this._lockedAt = new Date()
    this.addDomainEvent(createDomainEvent('PROJECT_LOCKED', this.id, { userId }))
    return Ok()
  }
}
```

#### 3. Application Layer (`src/application/`)

Use cases and orchestration.

**Example:**
```typescript
export class CreateProjectUseCase implements IUseCase<Request, Response> {
  constructor(private repo: IProjectRepository) {}
  
  async execute(request: Request): Promise<Result<Response>> {
    // 1. Validate and create entity
    // 2. Persist
    // 3. Publish events
    // 4. Return response
  }
}
```

#### 4. Infrastructure Layer (`src/infrastructure/`)

External dependencies and implementations.

**Example:**
```typescript
export class PrismaProjectRepository implements IProjectRepository {
  async save(project: Project): Promise<void> {
    const data = project.toPersistence()
    await db.mstProject.upsert({ /* ... */ })
  }
}
```

---

## 🎨 Design Patterns Used

### 1. Repository Pattern

**Purpose:** Abstract persistence logic from domain  
**Implementation:** Interface in domain, concrete in infrastructure

```typescript
// Domain defines the contract
export interface IProjectRepository {
  findById(id: string): Promise<Project | null>
  save(project: Project): Promise<void>
}

// Infrastructure implements it
export class PrismaProjectRepository implements IProjectRepository {
  // Prisma-specific implementation
}
```

### 2. Use Case Pattern

**Purpose:** Encapsulate business operations  
**Implementation:** One use case per business operation

```typescript
export class CreateProjectUseCase implements IUseCase<Request, Response> {
  async execute(request: Request): Promise<Result<Response>> {
    // Orchestrate domain logic
  }
}
```

### 3. Result Pattern

**Purpose:** Functional error handling without exceptions  
**Implementation:** Return Result<T, E> instead of throwing

```typescript
const result = Project.create(props)
if (result.isFailure) {
  return Fail(result.error!)
}
const project = result.value
```

### 4. Value Object Pattern

**Purpose:** Immutable domain values with behavior  
**Implementation:** Sealed objects with operations

```typescript
export class Money extends ValueObject<{ amount: Decimal; currency: string }> {
  add(other: Money): Money {
    return new Money(this.amount.plus(other.amount), this.currency)
  }
}
```

### 5. Domain Events Pattern

**Purpose:** Decouple components via events  
**Implementation:** Aggregates emit events, handlers react

```typescript
project.lock(userId)
const events = project.clearDomainEvents()
for (const event of events) {
  EventBus.publish(event)
}
```

---

## 🔒 Security Features

### Rate Limiting

All API endpoints protected with configurable rate limits:

- **General API:** 100 requests/minute
- **Authentication:** 5 requests/minute
- **File Upload:** 10 requests/minute

### Validation

All inputs validated using Zod schemas:

```typescript
const CreateProjectSchema = z.object({
  name: z.string().min(1).max(500),
  totalBudgetCeiling: z.coerce.number().positive(),
})
```

### Authorization

RBAC with permission-based access control:

```typescript
const auth = await authorizeApi('project.create')
if (auth.error) return auth.error
```

### Audit Logging

Automatic audit trails for all operations:

```typescript
AuditQueue.push({
  action: 'CREATE_PROJECT',
  entityType: 'MstProject',
  entityId: project.id,
  userId: request.userId,
})
```

---

## 🧪 Testing Strategy

### Test Pyramid

```
        ┌─────────┐
        │   E2E   │  10%
        ├─────────┤
        │  API    │  20%
        ├─────────┤
        │  Unit   │  70%
        └─────────┘
```

### Unit Tests

**Focus:** Domain entities, value objects, use cases

```typescript
describe('Project Entity', () => {
  it('should lock an unlocked project', () => {
    const project = Project.create({ /* ... */ }).value!
    const result = project.lock('user-123')
    expect(result.isSuccess).toBe(true)
  })
})
```

### Integration Tests

**Focus:** API routes, repositories, external services

```typescript
describe('POST /api/projects', () => {
  it('should create a project', async () => {
    const response = await request(app)
      .post('/api/projects')
      .send({ /* ... */ })
    expect(response.status).toBe(201)
  })
})
```

### Coverage Requirements

- **Lines:** 70%
- **Functions:** 70%
- **Branches:** 70%
- **Statements:** 70%

---

## 📊 API Standards

### Request Format

```json
{
  "name": "Project Name",
  "collieryCode": "TCL001",
  "totalBudgetCeiling": 5000000
}
```

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "prj_abc123",
    "name": "Project Name",
    "message": "Project created successfully"
  }
}
```

### Error Response

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "Project name is required"
    }
  ]
}
```

### Pagination

```json
{
  "success": true,
  "data": [ /* items */ ],
  "meta": {
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/coalrr"

# Redis (for production)
REDIS_URL="redis://localhost:6379"

# AWS S3 (for file storage)
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_REGION="ap-south-1"
S3_BUCKET="coalrr-files"

# Application
NODE_ENV="development"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

---

## 📈 Performance

### Optimization Techniques

- **Database:** Indexed queries, connection pooling
- **Caching:** Ready for Redis integration
- **API:** Rate limiting to prevent abuse
- **Frontend:** Code splitting, lazy loading
- **Images:** Next.js Image optimization

### Monitoring

- **Health Check:** `GET /api/health`
- **Metrics:** Ready for Prometheus integration
- **Logging:** Structured logging ready

---

## 🚦 Development Workflow

### Creating a New Feature

1. **Design Domain Model**
   - Define entities and value objects
   - Identify business rules
   - Define repository interface

2. **Implement Domain Layer**
   - Create entities with business logic
   - Write unit tests

3. **Implement Infrastructure**
   - Create repository implementation
   - Write integration tests

4. **Create Use Cases**
   - Orchestrate domain logic
   - Write use case tests

5. **Create API Endpoints**
   - Add validation
   - Add authorization
   - Add rate limiting

6. **Documentation**
   - Update README
   - Add code comments
   - Create ADR if needed

---

## 🤝 Contributing

### Before Submitting PR

```bash
npm run type-check  # TypeScript check
npm run lint        # Linting
npm run test        # All tests
npm run test:coverage  # Coverage check
```

### Code Review Checklist

- [ ] Business logic in domain entities
- [ ] Repository only handles persistence
- [ ] Use cases orchestrate domain logic
- [ ] Validation with Zod schemas
- [ ] Tests written (70%+ coverage)
- [ ] Error handling with Result pattern
- [ ] Rate limiting on API routes
- [ ] Authorization checks
- [ ] Documentation updated

---

## 📚 Additional Resources

### Internal Documentation

- [Architecture Refactoring Summary](./ARCHITECTURE_REFACTORING_SUMMARY.md)
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
- [API Documentation](./docs/api/README.md)
- [Database Schema](./prisma/schema.prisma)

### External Resources

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)

---

## 📞 Support

### Getting Help

1. Check documentation in `/docs`
2. Review example code in Project module
3. Check tests for usage examples
4. Consult with architecture team

### Reporting Issues

- Use GitHub Issues
- Provide reproduction steps
- Include error messages
- Tag with appropriate label

---

## 📜 License

© 2026 Eastern Coalfields Limited. All rights reserved.

---

## 🎯 Roadmap

### Phase 1: Foundation ✅ COMPLETE

- [x] Core infrastructure
- [x] Domain layer for Project module
- [x] Testing infrastructure
- [x] Security (rate limiting, validation)
- [x] Health checks

### Phase 2: Module Migration (In Progress)

- [ ] Proposal/Land Acquisition module
- [ ] Payroll module
- [ ] Form-I Claim module
- [ ] Employment module

### Phase 3: Advanced Infrastructure

- [ ] Redis integration
- [ ] Background jobs (BullMQ)
- [ ] Monitoring (Prometheus)
- [ ] Enhanced security (ABAC, refresh tokens)

### Phase 4: Performance

- [ ] DataLoader for N+1 queries
- [ ] Caching strategy
- [ ] Query optimization
- [ ] Bundle optimization

---

**Status:** Production Ready (Project Module)  
**Next Release:** v0.3.0 (Proposal Module Migration)  
**Maintained By:** Architecture Team  
**Last Updated:** 2026-07-09
