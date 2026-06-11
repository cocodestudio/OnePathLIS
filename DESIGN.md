# OnePath Lab Design Document

## 1. Overview
OnePath Lab is a multi-tenant Laboratory Information Management System (LIMS) designed for high-paced clinical environments. It allows laboratory technicians, pathologists, and administrators to streamline clinical intake, record diagnostic test results, generate reports, and manage billing.

The system is built to minimize manual entry errors, provide high-contrast readability, and generate instant PDF clinical reports, all while maintaining a precise and professional brand personality.

## 2. System Architecture
The application uses a modern, full-stack React framework approach:
- **Framework:** [Next.js 14](https://nextjs.org/) utilizing the App Router (`src/app`).
- **Frontend/UI:** React 18, Tailwind CSS for styling, and Radix UI primitives for accessible, high-quality interactive components.
- **Backend/API:** Next.js Route Handlers (`src/app/api/...`) for RESTful endpoints.
- **Database ORM:** [Prisma](https://www.prisma.io/) (`@prisma/client`).
- **Database Engine:** SQLite (configured for local development via `dev.db`), which can be easily migrated to PostgreSQL/MySQL for production.
- **Authentication:** [NextAuth.js v4](https://next-auth.js.org/) using a Credentials Provider with bcrypt password hashing.

## 3. Database Schema
The database is structured to support multi-tenancy (multiple labs) and relational clinical data.

- **`Lab`**: The root tenant entity. Contains details like lab name, email, and address. All other entities relate back to a specific Lab.
- **`User`**: System users (Staff, Admin, Pathologist) belonging to a specific Lab.
- **`Patient`**: Patient records including demographics, contact info, and referring doctor.
- **`Bill`**: Financial records tracking the total cost, discounts, and payment status (PAID, UNPAID, PARTIAL) for a patient's visit.
- **`Test`**: The catalog of available diagnostic tests offered by a Lab, including reference ranges (min/max), units, and prices.
- **`Report`**: A clinical report linked to a Patient and a Bill. Tracks overall status (PENDING, COMPLETED).
- **`ReportTest`**: The intersection of a Report and a Test. This is where individual diagnostic results (`resultValue`) are stored, along with an `isAbnormal` flag.

## 4. UI/UX Design Principles
As specified in `PRODUCT.md`, the UI relies on strict principles to cater to a medical environment:
- **Absolute Clinical Contrast**: WCAG AA compliance for readability under bright laboratory lights. Avoids low-contrast or overstimulating neon colors.
- **Minimal Cognitive Load**: Data is grouped logically (e.g., by parameter type) with clear typography and spacing.
- **Professional Dignity**: The interface feels authoritative and trustworthy.
- **Accessibility**: Support for reduced motion, keyboard navigability for fast data entry, and semantic HTML structures.
- **Visual Identity**: Uses standard Tailwind utility classes integrated with custom CSS variables (`globals.css`) for consistent theming and dark mode support. Recharts is used for dashboard analytics.

## 5. Application Structure
The codebase follows a standard Next.js App Router structure:
- `/prisma`: Contains the `schema.prisma` file, database migrations, and a database seed script.
- `/src/app`: Contains the routing logic.
  - `/api`: Backend REST API routes (e.g., `/analytics`, `/auth`, `/billing`, `/patients`, `/reports`, `/tests`).
  - `/dashboard`: The main authenticated application area, containing sub-modules for billing, patients, reports, and tests.
  - `/login`: The authentication entry point.
- `/src/components`: Reusable UI components.
  - `/ui`: Low-level, generic components built on Radix UI (Button, Input, Dialog, Select, etc.).
- `/src/lib`: Core utility functions, Prisma client singleton (`prisma.ts`), and NextAuth configuration (`auth.ts`).
- `/src/types`: TypeScript definitions (e.g., extending NextAuth types).

## 6. Authentication & Security
- **NextAuth** handles session lifecycle via JWTs.
- The `auth.ts` configuration includes custom callbacks to inject `labId`, `role`, and `labName` into the JWT and session objects, ensuring that API routes and client components can accurately enforce multi-tenant boundaries.
- **Bcrypt** is used for secure password hashing before storage.
