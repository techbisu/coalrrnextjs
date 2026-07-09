\# Enterprise Developer Documentation Generator Prompt



\## Objective



Generate a \*\*complete, professional, enterprise-grade Developer Documentation\*\* for this project.



Act as a \*\*Senior Software Architect\*\*, \*\*Technical Writer\*\*, and \*\*Solution Architect\*\*.



The documentation must be written for:



\* New Developers

\* Senior Developers

\* DevOps Engineers

\* QA Engineers

\* Technical Leads

\* Project Managers

\* System Administrators



The goal is that \*\*a completely new developer can understand the entire system architecture, business flow, framework design, services, configuration, and development guidelines without asking another developer\*\*.



This documentation should become the \*\*official developer handbook\*\* for the project.



\---



\# Documentation Goals



The documentation must explain



\* Why the system is designed this way

\* How every module works

\* How every framework works

\* How every service communicates

\* How every component is reused

\* How new developers should extend the system



Do not simply describe files.



Explain the complete architecture.



\---



\# Documentation Structure



Generate a professional documentation with the following sections.



\---



\# 1. Project Overview



Explain



Project Purpose



Business Goals



Target Users



Technology Stack



Architecture Style



Major Features



Modules



Project Vision



\---



\# 2. High Level Architecture



Generate architecture diagrams.



Explain



Presentation Layer



Application Layer



Service Layer



Repository Layer



Infrastructure Layer



Database Layer



File Storage



Background Jobs



External Services



Authentication



Authorization



Workflow



Notifications



Audit



Localization



Document Engine



File Management



\---



\# 3. Folder Structure



Explain every folder.



Example



```text

src/



modules/



core/



shared/



components/



layouts/



hooks/



providers/



repositories/



services/



middleware/



policies/



validators/



config/



types/



utils/



```



Explain why each folder exists.



Explain what belongs inside.



Explain what should never be placed inside.



\---



\# 4. Project Startup



Explain



Clone Project



Install



Environment



Database



Migration



Seed



Development



Production



Build



Deployment



\---



\# 5. Environment Variables



Document every environment variable.



Example



Variable



Purpose



Required



Default



Example Value



Security Notes



Used By



Example



```text

DATABASE\_URL



Used by Prisma



Required



Yes



Example



postgres://...

```



Repeat for every environment variable.



\---



\# 6. Configuration System



Explain



Application Config



Database Config



Authentication Config



Notification Config



Storage Config



Localization Config



Workflow Config



Document Engine Config



Audit Config



Security Config



Queue Config



Feature Flags



Explain every configuration option.



\---



\# 7. Authentication Framework



Explain



Login Flow



Logout



Session



Middleware



User Context



Token



Password



Remember Me



OTP



Future 2FA



Architecture Diagram



Sequence Diagram



Example Flow



\---



\# 8. Authorization Framework



Explain



RBAC



Policy



Permission



Role



Permission Cache



Menu Authorization



Button Authorization



API Authorization



Server Authorization



Component Authorization



Examples



How to create permission



How to assign role



How to check permission



How to protect page



How to protect API



\---



\# 9. Audit Framework



Explain



Automatic Logging



Manual Logging



Database Changes



Old Values



New Values



Timeline



Audit Viewer



Search



Retention



Architecture



Examples



\---



\# 10. Notification Framework



Explain



Event Bus



Notification Flow



Email



SMS



System Notification



Push



Templates



Queue



Retry



Scheduling



Configuration



Examples



\---



\# 11. Document Engine



Explain



DOCX Templates



Placeholder Engine



Dynamic Forms



Workflow



Signature



Preview



PDF



QR



Versioning



Download



Security



Examples



How to create new document template



How to register template



How to generate document



\---



\# 12. File Management Framework



Explain



Upload



Preview



Download



Storage Provider



Version



Metadata



Thumbnail



Permissions



Audit



Examples



\---



\# 13. Secure Download Service



Explain



Authorization



Watermark



QR



Footer



Audit



Download Flow



Temporary URLs



Examples



\---



\# 14. Localization Framework



Explain



next-intl



Database Translation



Cache



Admin Translation



Language Switching



Fallback



DOCX Localization



Examples



\---



\# 15. Workflow Engine



Explain



Workflow Configuration



Approval



Reject



Return



Forward



Escalation



History



Signatures



Examples



How to create workflow



\---



\# 16. URL Framework



Explain



REST URLs



Public IDs



Slug



Encrypted URLs



Signed URLs



Routing



Examples



\---



\# 17. CAPTCHA Framework



Explain



Provider



Math CAPTCHA



Future Providers



Validation



Security



Examples



\---



\# 18. Event System



Explain



Events



Publish



Subscribe



Notification Integration



Audit Integration



Workflow Integration



Examples



\---



\# 19. Background Job Framework



Explain



Job Service



Queue



Sync Provider



BullMQ Provider



Workers



Retry



Scheduling



Development Mode



Production Mode



Examples



\---



\# 20. Storage Framework



Explain



Local



MinIO



S3



Azure



Configuration



Provider Pattern



Examples



\---



\# 21. Repository Pattern



Explain



Purpose



Responsibilities



Rules



Best Practices



Example Repository



When to create repository



\---



\# 22. Service Layer



Explain



Purpose



Responsibilities



Business Logic



Transaction Management



Validation



Examples



\---



\# 23. Policies



Explain



Purpose



Authorization



Examples



Proposal Policy



Document Policy



Workflow Policy



\---



\# 24. API Layer



Explain



REST Design



Validation



Response Format



Pagination



Filtering



Error Handling



Versioning



Examples



\---



\# 25. Database



Explain



ER Diagram



Relationships



Indexes



Constraints



Naming Convention



Audit Tables



Version Tables



\---



\# 26. Component Library



Document every reusable component.



Explain



Purpose



Props



Usage



Example



Do



Don't



\---



\# 27. Hooks



Document every custom hook.



Purpose



Parameters



Return Value



Example



\---



\# 28. Providers



Document every provider.



Responsibilities



Configuration



Usage



\---



\# 29. Middleware



Document every middleware.



Authentication



Authorization



Localization



Logging



Security



\---



\# 30. Validators



Document every validator.



Input



Rules



Example



\---



\# 31. Utilities



Document every utility.



Purpose



Usage



Examples



\---



\# 32. Coding Standards



Naming Convention



Folder Convention



File Naming



Component Naming



Variable Naming



Commit Convention



Code Style



Documentation Rules



\---



\# 33. Enterprise Development Guidelines



How to create



New Module



New Page



New Service



New Repository



New Policy



New Notification



New Workflow



New Document Template



New Translation



New Permission



New API



New Event



New Job



New Storage Provider



Step-by-step guide.



\---



\# 34. Error Handling



Global Error Handler



Business Exceptions



Validation Exceptions



Logging



Retry



Examples



\---



\# 35. Performance Guidelines



Server Components



Client Components



Caching



Lazy Loading



Image Optimization



Database Optimization



Memoization



Best Practices



\---



\# 36. Security Guidelines



Authentication



Authorization



CSRF



XSS



SQL Injection



Encryption



Secrets



File Upload



Rate Limiting



Audit



Best Practices



\---



\# 37. Deployment Guide



Development



Testing



Staging



Production



Docker (future)



Redis (future)



BullMQ (future)



Backups



Monitoring



Health Checks



\---



\# 38. Troubleshooting Guide



Common Problems



Solutions



Logs



Debugging



Performance



Database



Authentication



Permissions



Notifications



Storage



Documents



\---



\# 39. FAQ



Create practical developer FAQs.



Examples



How to create new module?



How to add permission?



How to generate document?



How to upload file?



How to add translation?



How to send notification?



How to add workflow?



How to add audit?



\---



\# 40. Future Roadmap



Document future planned architecture.



Redis



BullMQ



Microservices



AI



OCR



Search Engine



Mobile API



Multi Tenant



Analytics



Monitoring



\---



\# Documentation Quality



Every section should include



Overview



Architecture Diagram



Flow Diagram



Sequence Diagram (where appropriate)



Code Examples



Best Practices



Common Mistakes



Performance Notes



Security Notes



Extension Guide



\---



\# Writing Style



Write professionally.



Explain concepts simply.



Avoid unnecessary jargon.



Every concept should be understandable by a junior developer while still providing sufficient detail for senior developers.



Include tables, diagrams, flowcharts, examples, and practical implementation guidance wherever appropriate.



\---



\# Final Goal



Produce a complete \*\*Enterprise Developer Handbook\*\* that serves as the single source of truth for the project.



The documentation should explain every framework, service, configuration, module, reusable component, business flow, integration point, architectural decision, coding standard, and development guideline.



A new developer should be able to clone the project, understand the architecture, develop new features, extend existing frameworks, debug issues, and deploy the application using only this documentation without requiring additional onboarding from another team member.



Generate the documentation in well-structured Markdown with a table of contents, internal cross-references, Mermaid diagrams where appropriate, and a modular organization so it can be published directly as a project wiki or documentation site (e.g., Docusaurus, MkDocs, or GitHub Docs).



