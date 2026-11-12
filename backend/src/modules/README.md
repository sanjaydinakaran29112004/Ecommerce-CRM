# Enterprise CRM Modules Architecture

This directory houses domain-specific modules adhering to the **Modular Monolith** pattern.
Each module encapsulates:
- `*.model.js`: Mongoose schema, validation rules, indexes, instance/static methods.
- `*.routes.js`: HTTP endpoint routing, rate limiters, validation, auth & permission guards.
- `*.controller.js`: Request unpacking, calling services, HTTP status response formatting.
- `*.service.js`: Core business logic, DB transactions, calculations, audit event emission.
- `*.validation.js`: Zod input validation schemas for body, query, and path parameters.

### Domain Modules:
- `auth/`: Authentication, JWT session lifecycle, refresh token rotation, login security.
- `users/`: Staff accounts, role assignments, custom permission overrides.
- `customers/`: Customer 360 profiles, RFM behavioral scoring, notes, timelines.
- `leads/`: B2B & wholesale sales opportunities, pipeline stages, conversion.
- `products/`: Product catalogue, SKU, categories, variants.
- `inventory/`: Stock tracking, low-stock thresholds, stock movement audit trail.
- `orders/`: Multi-stage order lifecycle, manual order creation, line-item snapshots.
- `payments/`: Payment gateway webhooks, reconciliation, idempotent event log.
- `support/`: Ticketing system, priority escalation, SLA timer tracking.
- `campaigns/`: Customer segmentation engine, promotional & retention email dispatch.
- `tasks/`: Employee to-dos, activity logging, overdue alerts.
- `returns/`: RMA (Return Merchandise Authorization) multi-stage inspection & refunds.
- `reports/`: Aggregated business KPIs, sales trends, cohort retention analytics.
- `auditLogs/`: Append-only compliance ledger tracking all sensitive system events.

