# Enterprise Architecture Review & Refactoring Prompt for Next.js

## Objective

Analyze the **entire project structure, architecture, source code, folder organization, business flow, dependencies, reusable components, services, and framework design** of this Next.js application.

Act as a **Senior Enterprise Software Architect** with experience building large-scale Government ERP, Banking, Workflow, DMS, GIS and SaaS platforms.

The goal is **NOT** only to find code issues.

The goal is to redesign the application into a **true enterprise-grade, reusable, service-oriented platform**.

Do not make assumptions.

Inspect the entire project before suggesting improvements.

---

# Primary Goals

Evaluate whether the application is suitable for

* Enterprise
* Government
* Banking
* Large Organization
* Multi Module System

Determine if the architecture is

Scalable

Maintainable

Reusable

Testable

Future Proof

Performance Optimized

Security Focused

Developer Friendly

---

# Analyze Everything

Analyze

Folder Structure

Architecture

Business Flow

Module Design

Shared Components

Routing

API Design

Authentication

Authorization

Workflow

Document Engine

File Management

Notification

Localization

Audit

Database Layer

Repositories

Services

Utilities

Hooks

Providers

Middleware

Caching

Background Jobs

Configuration

Error Handling

Validation

Logging

Environment Variables

Dependency Injection

State Management

UI Structure

Naming Convention

Type Safety

Code Reusability

---

# Design Principles

Verify whether the project follows

SOLID

Clean Architecture

Repository Pattern

Service Layer

Dependency Injection

Single Responsibility

Open Closed

Interface Segregation

Dependency Inversion

DRY

KISS

Composition over Inheritance

Convention over Configuration

Domain Driven Design where appropriate

Policy Based Authorization

RBAC

Feature Based Architecture

---

# Folder Structure Review

Analyze whether folders are properly separated.

Expected architecture should resemble

```text
src/

modules/

core/

shared/

components/

layouts/

hooks/

services/

repositories/

providers/

policies/

middleware/

validators/

events/

notifications/

jobs/

storage/

localization/

authorization/

audit/

workflow/

documents/

file-management/

utils/

types/

config/

constants/

database/

lib/

```

Determine whether files belong in the correct location.

Recommend restructuring if necessary.

---

# Module Review

For every module determine

Responsibilities

Dependencies

Coupling

Reusability

Scalability

Testability

Hidden Business Logic

Duplicate Code

Circular Dependency

Tight Coupling

Recommend improvements.

---

# Business Logic Review

Business logic should never exist inside

React Components

Pages

Layouts

UI Components

Move business logic into

Services

Repositories

Policies

Providers

Frameworks

---

# Component Review

Analyze

Component Reusability

Component Size

Props

Composition

Performance

Generic Components

Feature Components

Shared Components

Determine

Can component become reusable?

Should component be split?

Is component doing too much?

---

# Service Layer Review

Every business operation should belong to a Service.

Check

DocumentService

WorkflowService

NotificationService

FileService

UserService

RoleService

AuditService

LocalizationService

Determine

Missing services

Duplicated logic

Service coupling

---

# Repository Layer Review

Repositories should only access database.

Verify

No business logic.

No HTTP logic.

No UI logic.

Recommend improvements.

---

# Authentication Review

Analyze

Authentication Flow

Session Management

Middleware

Token Handling

Security

Refresh Token

Permission Loading

---

# Authorization Review

Verify

RBAC

Policies

Permission Guards

Route Guards

Menu Authorization

Button Authorization

Server Authorization

Client Authorization

Recommend enterprise improvements.

---

# Routing Review

Analyze

RESTful URLs

Nested Routes

Dynamic Routes

Protected Routes

Public Routes

Module Routing

Professional URL Design

---

# State Management

Analyze

React Context

Zustand

React Query

Server State

Client State

Duplicate State

Recommend best architecture.

---

# API Review

Review

REST Design

Naming

Response Structure

Error Handling

Validation

Pagination

Filtering

Sorting

Versioning

Consistency

---

# Database Review

Analyze

Schema

Normalization

Indexes

Relationships

Naming

Constraints

Audit

Versioning

Soft Delete

History

---

# File Management Review

Verify

Central File Service

Storage Provider

Preview

Download

Version

Metadata

Audit

---

# Document Engine Review

Verify

Template Management

Workflow

Signature

Version

Preview

PDF

Security

Reusability

---

# Workflow Review

Analyze

Approval Flow

Escalation

History

Dynamic Configuration

Role Resolution

Notification

Audit

---

# Notification Review

Verify

Event Driven Design

Queue

Templates

Channels

Retry

Scheduling

---

# Audit Review

Verify

Automatic Logging

Database Changes

Old Value

New Value

Timeline

Entity History

Security Logs

---

# Localization Review

Analyze

next-intl

Database Translation

Caching

Admin Translation

Fallback

---

# Configuration Review

Determine

Hardcoded Values

Magic Strings

Magic Numbers

Environment Variables

Feature Flags

Configuration Management

---

# Security Review

Analyze

Authentication

Authorization

XSS

CSRF

SQL Injection

File Upload

Rate Limiting

Encryption

Secrets

Sensitive Data

Permission Checks

Audit

Logging

---

# Performance Review

Analyze

Rendering

Memoization

Caching

Database Queries

N+1 Problems

Lazy Loading

Code Splitting

Bundle Size

Image Optimization

Server Components

Client Components

Streaming

---

# Dependency Review

Analyze

Unused Packages

Heavy Packages

Duplicate Packages

Circular Dependencies

Future Risks

---

# Code Quality

Review

Naming

Consistency

Readability

Maintainability

Documentation

Comments

Code Smells

Anti Patterns

Large Files

Large Components

Large Services

---

# Enterprise Framework Review

Verify whether reusable frameworks exist for

Authentication

Authorization

Audit

Notification

Localization

Workflow

File Management

Document Engine

Secure Download

URL Service

Captcha

Job Service

Storage

Configuration

Event Bus

If missing

Recommend reusable framework design.

---

# Missing Enterprise Features

Identify everything missing for a large enterprise platform.

Examples

Event Bus

Queue

Background Jobs

Cache Layer

Policy Layer

Feature Flags

Health Check

Monitoring

Metrics

Tracing

API Versioning

Rate Limiting

Tenant Support

Backup

Scheduler

Disaster Recovery

---

# Refactoring Plan

After analysis provide

Current Architecture

Problems

Severity

Impact

Recommended Solution

Estimated Complexity

Priority

Migration Strategy

Risk

Expected Benefit

---

# Architecture Diagram

Generate improved architecture.

Example

```text
Presentation Layer

↓

Application Layer

↓

Service Layer

↓

Repository Layer

↓

Infrastructure Layer

↓

Database
```

Also generate module dependency diagram.

---

# Output Format

Provide

1. Executive Summary

2. Architecture Score (0–100)

3. Folder Structure Score

4. Code Quality Score

5. Security Score

6. Performance Score

7. Scalability Score

8. Reusability Score

9. Maintainability Score

10. Enterprise Readiness Score

11. Violations of SOLID

12. Clean Architecture Issues

13. Repository Pattern Issues

14. Service Layer Issues

15. RBAC Issues

16. Policy Issues

17. Component Issues

18. Refactoring Recommendations

19. New Folder Structure

20. Migration Plan

21. Priority Matrix

22. Final Enterprise Architecture

---

# Final Goal

Review the project as if preparing it for a **10+ year enterprise lifecycle**.

Recommend how to transform it into a highly reusable, modular, service-oriented platform where every module is independent, every business rule resides in services and policies, repositories only handle persistence, shared frameworks are reused across the application, and the codebase follows SOLID, Clean Architecture, Repository Pattern, Service Layer, Policy-Based Authorization and RBAC.

Do not only point out problems. Provide concrete refactoring recommendations, improved folder structures, dependency diagrams, migration strategies and reusable framework designs that can be implemented incrementally without breaking existing functionality.
