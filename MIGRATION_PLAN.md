# LIS Backend Migration Plan (Next.js/Prisma -> Laravel/PostgreSQL)

This document outlines the detailed step-by-step plan to manually migrate the OnePath Lab backend from the existing Next.js Prisma/SQLite stack to the existing Laravel/PostgreSQL backend, ensuring it's completely production-ready without altering any of the existing admin or portfolio logic.

## 1. Database Schema Migrations
Since PostgreSQL natively supports UUIDs, we will use UUIDs for all new primary keys (matching the Prisma schema) while leaving the existing `users` table's BigInt ID untouched to prevent breaking existing relationships. 
We will manually create the following Laravel migration files:
- **`create_labs_table`**: Stores lab details (name, email, address, print settings).
- **`alter_users_table_for_lis`**: Adds `lab_id` (foreign key to `labs.id`) and `role` to the existing `users` table.
- **`create_patients_table`**: Stores patient details (custom_id, lab_id, name, age, gender, etc.).
- **`create_bills_table`**: Stores financial bills (total, discount, paid_amount, status).
- **`create_reports_table`**: Stores the generated reports (linked to bill and patient).
- **`create_tests_table`**: The complex test master hierarchy (parent_id, ranges, custom options).
- **`create_report_tests_table`**: The pivot table storing the actual results entered by technicians.

## 2. Eloquent Models
We will manually create production-ready Eloquent models that mimic the Prisma schema relationships. All models will use the `HasUuids` trait since they use UUID primary keys.
- **`Lab`**: `HasMany` Users, Patients, Bills, Reports, Tests.
- **`Patient`**: `BelongsTo` Lab, `HasMany` Bills, Reports.
- **`Bill`**: `BelongsTo` Lab, Patient. `HasMany` Reports.
- **`Report`**: `BelongsTo` Lab, Bill, Patient. `HasMany` ReportTests.
- **`Test`**: `BelongsTo` Lab, Parent Test. `HasMany` SubTests, ReportTests.
- **`ReportTest`**: `BelongsTo` Report, Test.
- **`User` (Modification)**: Update the existing `#[Fillable]` attribute to include `lab_id` and `role`, and add a `BelongsTo` relationship to the `Lab` model.

## 3. Controllers & Business Logic
We will implement RESTful API controllers that directly match the JSON payloads currently expected by the Next.js frontend frontend.
- **`LabController`**: Settings and profile updates.
- **`PatientController`**: CRUD for patients.
- **`TestController`**: Master test creation (handling hierarchical parent/child inserts).
- **`ReportController`**: Report generation and result entry logic.
- **`BillingController`**: Handling financial updates on bills.
- **`AnalyticsController`**: Aggregating data for the dashboard charts.
- **`AuthController`**: Implement Sanctum-based login/logout endpoints to replace NextAuth.

## 5. Critical Bug Fixes Applied for Production
During a deep audit, two severe architectural flaws (which existed in the original Prisma schema) were fixed to make this SaaS-ready:
1. **Multi-Tenancy Custom ID Fix:** The original Prisma schema strictly marked `customId` (e.g. LAB-2026-0001) as `@unique`. In a multi-tenant environment, this would crash the database the moment a second lab tried to register their first patient. The migration now enforces uniqueness *per-lab* using a composite key: `$table->unique(['lab_id', 'custom_id']);`.
2. **Safe ID Generation:** Relying on `count() + 1` to generate custom IDs causes fatal unique constraint violations if a row is ever deleted. The controllers now use regex to extract the sequence from the absolute latest created record to safely increment.
3. **CamelCase/snake_case Bridge:** A completely invisible bridge was built to ensure the Next.js frontend (which uses `camelCase`) can talk to the Laravel backend (which uses `snake_case`) without modifying any frontend code. `SnakeCaseRequests` middleware intercepts incoming requests, and the `CamelCaseApi` trait formats all outgoing Eloquent responses.
4. **Lab Initialization Endpoint:** Added a `POST /api/lis/lab` endpoint in `LabController` so newly registered users can initialize their own isolated laboratory.

---
*No terminal commands (like `php artisan`) will be executed during this process as requested. All files will be statically written so they can be run locally by the developer later.*
