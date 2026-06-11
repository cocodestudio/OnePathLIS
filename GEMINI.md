# Gemini AI Assistant Guide

This document provides instructions and context for interacting with me (Gemini) while developing or debugging the OnePath Lab application.

## 1. How I Can Help
As an advanced AI coding assistant, I can help you:
- **Build New Features**: Generate full-stack features from UI components to Prisma schema updates and Next.js API routes.
- **Refactor Code**: Optimize existing React components, move logic to custom hooks, or clean up Tailwind classes.
- **Debug Issues**: Trace errors through the Next.js App Router, fix Prisma query issues, or resolve TypeScript type errors.
- **Design Implementation**: Ensure UI changes adhere to the "Absolute Clinical Contrast" and "Minimal Cognitive Load" principles defined in `PRODUCT.md`.

## 2. Project Context & Stack
When asking me to write code, I automatically consider the following stack:
- **Next.js 14 (App Router)**: I will use Server Components by default, and add `"use client"` only when hooks or interactive elements are required.
- **Tailwind CSS & Radix UI**: I will use existing components in `src/components/ui` whenever possible to maintain design consistency.
- **Prisma**: I will write efficient database queries, keeping multi-tenancy in mind (always filtering by `labId`).
- **NextAuth**: I will use `useSession` on the client and `getServerSession` on the server to authenticate requests.

## 3. Key Commands
You can ask me to run these commands, or run them yourself:
- `npm run dev`: Start the local development server (http://localhost:3000).
- `npx prisma studio`: Open a visual editor for the local SQLite database.
- `npx prisma db push` or `npx prisma migrate dev`: Apply schema changes to the database.
- `npx prisma generate`: Regenerate the Prisma Client after schema changes.
- `node prisma/seed.js`: Seed the database with initial dummy data.

## 4. Best Practices for Prompts
To get the best results from me, provide clear context:
- **Be Specific**: "Create a new API route in `src/app/api/patients/route.ts` that fetches patients for the current user's lab."
- **Mention Relevant Files**: If you have a specific component in mind, mention it (e.g., "Update the `StatCard` in `src/app/dashboard/page.tsx`").
- **UI Changes**: Remind me to use Lucide React icons or specific Radix UI components if you have a preference.
- **Errors**: Paste the exact error message or stack trace so I can pinpoint the issue quickly.

## 5. Development Workflow with Gemini
1. **Database Changes**: Ask me to update `prisma/schema.prisma`. Once updated, I can help you run the migration and update the generated client.
2. **Backend API**: Ask me to create or update a Route Handler in `src/app/api/`. I will ensure it uses `getServerSession` to verify the user and `labId`.
3. **Frontend UI**: Ask me to build the UI page in `src/app/dashboard/...` or create reusable components in `src/components/`.

Feel free to ask me to analyze any part of the codebase or explain how different pieces interact!
