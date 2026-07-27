// Global Dependency Injection Container
// This file acts as an aggregator. To add new dependencies, edit the respective module file in ./modules/
// See .agents/rules/architecture.md for DI rules.

export * from './modules/admin.di'
export * from './modules/auth.di'
export * from './modules/project.di'
export * from './modules/finance.di'
export * from './modules/land.di'
export * from './modules/core.di'
export * from './modules/file.di'
export * from './modules/captcha.di'
export * from './modules/document-engine.di'
export * from './modules/audit.di'
export * from './modules/dashboard.di'
