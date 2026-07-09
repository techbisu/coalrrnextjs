# 🚀 COALRR Platform - Implementation Guide

**Version:** 1.0  
**Date:** 2026-07-09  
**Status:** Ready for Implementation

---

## 📋 Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install all necessary dependencies including:
- **Vitest** - Testing framework
- **Testing Library** - React component testing
- **MSW** - API mocking
- **Coverage tools** - Code coverage reporting

### 2. Generate Prisma Client

```bash
npm run db:generate
```

### 3. Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode (for development)
npm run test:watch

# Run with UI
npm run test:ui
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

---

## 🏗️ Architecture Overview

### Layer Structure

```
┌─────────────────────────────────────────────────────────┐
│                   Presentation Layer                     │
│              (Next.js App Router + API)                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  Application Layer                       │
│          (Use Cases, DTOs, Validation)                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                    Domain Layer                          │
│    (Entities, Value Objects, Business Rules)             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                Infrastructure Layer                      │
│        (Prisma, Redis, S3, External APIs)                │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Directory Structure Explained

### Core Layer (`src/core/`)
Shared kernel - used by all other layers

```
core/
├── base/              # Base classes for domain
│   ├── Entity.ts      # Base entity with identity
│   ├── ValueObject.ts # Immutable value objects
│   ├── AggregateRoot.ts # Root entities with events
│   └── DomainEvent.ts # Event sourcing foundation
├── result/
│   └── Result.ts      # Functional error handling
├── errors/            # Exception hierarchy
│   ├── DomainException.ts
│   ├── ValidationException.ts
│   ├── NotFoundException.ts
│   └── UnauthorizedException.ts
└── interfaces/        # Contracts and abstractions
    ├── Repository.interface.ts
    └── UseCase.interface.ts
```

### Domain Layer (`src/domain/`)
Business logic and rules - framework-independent

```
domain/
├── value-objects/     # Immutable domain values
│   ├── Money.ts       # Currency-aware monetary values
│   └── Area.ts        # Land area measurements
└── entities/
    └── project/       # Project aggregate
        ├── Project.ts # Rich domain model
        ├── ProjectId.ts # Type-safe ID
        └── ProjectRepository.interface.ts
```

### Application Layer (`src/application/`)
Use cases and orchestration

```
application/
├── use-cases/
│   └── project/
│       ├── CreateProjectUseCase.ts
│       ├── LockProjectUseCase.ts
│       └── GetProjectDashboardUseCase.ts
├── validators/
│   └── schemas.ts     # Zod validation schemas
└── middleware/
    └── validation.ts  # Request validation helpers
```

### Infrastructure Layer (`src/infrastructure/`)
External dependencies and implementations

```
infrastructure/
├── persistence/
│   └── repositories/
│       └── PrismaProjectRepository.ts
└── security/
    └── RateLimiter.ts
```

---

## 🎯 Implementation Patterns

### 1. Creating a Domain Entity

**Example: Project Entity**

```typescript
// src/domain/entities/project/Project.ts
import { AggregateRoot } from '@/core/base/AggregateRoot'
import { Result } from '@/core/result/Result'

export class Project extends AggregateRoot<string> {
  private _name: string
  private _budget: Money
  private _lockedAt: Date | null

  // Private constructor - use factory methods
  private constructor(props: ProjectProps) {
    super(props.id.value)
    this._name = props.name
    this._budget = props.budget
    this._lockedAt = props.lockedAt
  }

  // Factory method with validation
  static create(props: CreateProjectProps): Result<Project, ValidationException> {
    // Validate all props
    const errors: Array<{ field: string; message: string }> = []
    
    if (!props.name || props.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Name is required' })
    }

    if (errors.length > 0) {
      return Fail(new ValidationException('Validation failed', errors))
    }

    return Ok(new Project({ /* ... */ }))
  }

  // Business behavior
  lock(userId: string): Result<void, ProjectAlreadyLockedException> {
    if (this._lockedAt !== null) {
      return Fail(new ProjectAlreadyLockedException(this.id))
    }

    this._lockedAt = new Date()
    this.addDomainEvent(createDomainEvent('PROJECT_LOCKED', this.id, { userId }))
    return Ok()
  }

  // Business rules
  canBeEdited(): boolean {
    return this._lockedAt === null
  }
}
```

### 2. Creating a Value Object

**Example: Money**

```typescript
// src/domain/value-objects/Money.ts
import { ValueObject } from '@/core/base/ValueObject'
import Decimal from 'decimal.js'

export class Money extends ValueObject<{ amount: Decimal; currency: string }> {
  private constructor(amount: Decimal, currency: string) {
    super({ amount, currency })
  }

  static fromINR(value: number | string): Money {
    return new Money(new Decimal(value), 'INR')
  }

  // Immutable operations - always return new instances
  add(other: Money): Money {
    this.ensureSameCurrency(other)
    return new Money(
      this._value.amount.plus(other._value.amount),
      this._value.currency
    )
  }

  // Business logic
  percentage(percent: number): Money {
    return new Money(
      this._value.amount.times(percent).dividedBy(100),
      this._value.currency
    )
  }
}
```

### 3. Creating a Repository Interface

**Example: Project Repository**

```typescript
// src/domain/entities/project/ProjectRepository.interface.ts
import { Project } from './Project'
import { IPaginatedResult, IQueryOptions } from '@/core/interfaces'

export interface IProjectRepository {
  findById(id: string): Promise<Project | null>
  findAll(options?: IQueryOptions): Promise<IPaginatedResult<Project>>
  save(project: Project): Promise<void>
  delete(id: string): Promise<void>
  exists(id: string): Promise<boolean>
}
```

### 4. Implementing a Repository

**Example: Prisma Project Repository**

```typescript
// src/infrastructure/persistence/repositories/PrismaProjectRepository.ts
import { db } from '@/lib/db'
import { Project, IProjectRepository } from '@/domain'

export class PrismaProjectRepository implements IProjectRepository {
  async findById(id: string): Promise<Project | null> {
    const data = await db.mstProject.findUnique({ where: { id } })
    if (!data) return null
    
    // Map from persistence to domain
    return Project.reconstitute({
      id: data.id,
      name: data.name,
      totalBudgetCeiling: data.totalBudgetCeiling.toString(),
      // ... other fields
    })
  }

  async save(project: Project): Promise<void> {
    const data = project.toPersistence()
    
    await db.mstProject.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    })
  }
}
```

### 5. Creating a Use Case

**Example: Create Project Use Case**

```typescript
// src/application/use-cases/project/CreateProjectUseCase.ts
import { IUseCase, Result } from '@/core'
import { Project, IProjectRepository } from '@/domain'
import { EventBus } from '@/notifications/EventBus'

export class CreateProjectUseCase implements IUseCase<CreateProjectRequest, CreateProjectResponse> {
  constructor(private readonly repository: IProjectRepository) {}

  async execute(request: CreateProjectRequest): Promise<Result<CreateProjectResponse>> {
    // 1. Create domain entity (validation happens here)
    const projectResult = Project.create(request)
    if (projectResult.isFailure) {
      return Fail(projectResult.error!)
    }

    const project = projectResult.value

    // 2. Persist
    await this.repository.save(project)

    // 3. Publish events
    const events = project.clearDomainEvents()
    for (const event of events) {
      EventBus.publish({ /* ... */ })
    }

    // 4. Return response
    return Ok({
      id: project.id,
      name: project.name,
      message: 'Project created successfully',
    })
  }
}
```

### 6. Creating an API Route

**Example: Projects API**

```typescript
// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateBody } from '@/application/middleware/validation'
import { CreateProjectSchema } from '@/application/validators/schemas'
import { CreateProjectUseCase } from '@/application/use-cases/project'
import { PrismaProjectRepository } from '@/infrastructure/persistence/repositories'
import { apiRateLimiter, getClientIdentifier } from '@/infrastructure/security'

const repository = new PrismaProjectRepository()

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting
    const clientId = getClientIdentifier(req)
    const rateLimit = apiRateLimiter.check(clientId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    // 2. Authorization
    const auth = await authorizeApi('project.create')
    if (auth.error) return auth.error

    // 3. Validation
    const bodyResult = await validateBody(req, CreateProjectSchema)
    if (!bodyResult.success) return bodyResult.error

    // 4. Execute use case
    const useCase = new CreateProjectUseCase(repository)
    const result = await useCase.execute({
      ...bodyResult.data,
      userId: auth.user.id,
    })

    // 5. Handle result
    if (result.isFailure) {
      return NextResponse.json(
        { error: result.error!.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: true, data: result.value },
      { status: 201 }
    )
  } catch (e: any) {
    console.error('API error:', e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 7. Writing Tests

**Example: Domain Entity Test**

```typescript
// tests/unit/domain/entities/Project.test.ts
import { describe, it, expect } from 'vitest'
import { Project } from '@/domain/entities/project/Project'

describe('Project Entity', () => {
  describe('create', () => {
    it('should create a valid project', () => {
      const result = Project.create({
        name: 'Test Project',
        collieryCode: 'TCL001',
        totalLandLimitAcres: 1000,
        totalBudgetCeiling: 5000000,
        totalEmploymentQuota: 100,
      })

      expect(result.isSuccess).toBe(true)
      expect(result.value?.name).toBe('Test Project')
    })

    it('should fail with empty name', () => {
      const result = Project.create({
        name: '',
        // ... other fields
      })

      expect(result.isFailure).toBe(true)
    })
  })

  describe('lock', () => {
    it('should lock an unlocked project', () => {
      const project = Project.create({ /* ... */ }).value!
      const lockResult = project.lock('user-123')

      expect(lockResult.isSuccess).toBe(true)
      expect(project.isLocked()).toBe(true)
    })
  })
})
```

---

## 🔧 Common Tasks

### Adding a New Module

1. **Create Domain Entities** (`src/domain/entities/[module]/`)
   - Define entity class
   - Define value objects
   - Define repository interface

2. **Implement Repository** (`src/infrastructure/persistence/repositories/`)
   - Implement repository interface
   - Handle persistence mapping

3. **Create Use Cases** (`src/application/use-cases/[module]/`)
   - Create use case classes
   - Implement orchestration logic

4. **Define Validation** (`src/application/validators/schemas.ts`)
   - Create Zod schemas

5. **Create API Routes** (`src/app/api/[module]/`)
   - Add rate limiting
   - Add authorization
   - Add validation
   - Execute use cases

6. **Write Tests** (`tests/`)
   - Unit tests for entities
   - Unit tests for use cases
   - Integration tests for API

### Running Database Migrations

```bash
# Create a new migration
npm run db:migrate

# Push schema without migration (dev)
npm run db:push

# Reset database
npm run db:reset

# Open Prisma Studio
npm run db:studio
```

### Debugging

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Run specific test
npm test Project.test.ts

# Run tests with UI
npm run test:ui
```

---

## 📊 Code Quality Standards

### Coverage Thresholds

- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

### File Size Limits

- Max 500 lines per file
- Split large files into smaller modules

### Naming Conventions

- **Entities**: PascalCase (e.g., `Project`, `Proposal`)
- **Value Objects**: PascalCase (e.g., `Money`, `Area`)
- **Use Cases**: PascalCase with `UseCase` suffix (e.g., `CreateProjectUseCase`)
- **Interfaces**: PascalCase with `I` prefix (e.g., `IProjectRepository`)
- **Variables**: camelCase (e.g., `projectName`, `totalBudget`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)

---

## 🐛 Troubleshooting

### Tests Not Running

```bash
# Clear cache
rm -rf node_modules/.vitest

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Prisma Client Not Found

```bash
npm run db:generate
```

### Type Errors

```bash
# Check types
npm run type-check

# Regenerate Prisma types
npm run db:generate
```

### Import Errors

- Check path aliases in `tsconfig.json`
- Ensure `@/` maps to `./src/`
- Restart TypeScript server in IDE

---

## 📚 Additional Resources

### Documentation

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Value Objects](https://martinfowler.com/bliki/ValueObject.html)

### Related Files

- `ARCHITECTURE_REFACTORING_SUMMARY.md` - Complete refactoring summary
- `vitest.config.ts` - Test configuration
- `tsconfig.json` - TypeScript configuration
- `prisma/schema.prisma` - Database schema

---

## 🤝 Contributing

### Before Committing

```bash
# Run all checks
npm run type-check
npm run lint
npm run test:coverage
```

### Pull Request Checklist

- [ ] Tests written (minimum 70% coverage)
- [ ] All tests passing
- [ ] Type check passing
- [ ] Lint passing
- [ ] Business logic in domain entities
- [ ] Repository only handles persistence
- [ ] Use cases orchestrate domain logic
- [ ] API routes validated with Zod
- [ ] Rate limiting on API routes
- [ ] Documentation updated

---

## 📞 Support

For questions or issues:
1. Check this guide
2. Review example code in Project module
3. Check tests for usage examples
4. Consult with architecture team

---

**Last Updated:** 2026-07-09
