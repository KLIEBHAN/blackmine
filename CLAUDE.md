# Blackmine - Project Guide

A Redmine clone built with Next.js 16, React 19, and TypeScript.

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **UI:** React 19, Radix UI, Tailwind CSS, shadcn/ui components
- **Database:** SQLite via Prisma with libSQL adapter
- **Testing:** Vitest for unit tests, Playwright for E2E

## Project Structure

- `src/app/` - Next.js App Router pages and layouts
- `src/app/actions/` - Server Actions for data mutations
- `src/components/ui/` - Reusable UI components (shadcn/ui based)
- `src/types/` - Shared TypeScript types and constants
- `src/lib/` - Utility functions and database client

## Issue-Workflow

### Status Values

Issues have a `status` field with these possible values:

| Status | Label | Description |
|--------|-------|-------------|
| `new` | New | Freshly created issue, not yet started |
| `in_progress` | In Progress | Work has begun on the issue |
| `resolved` | Resolved | Work completed, awaiting verification |
| `closed` | Closed | Issue verified and closed |
| `rejected` | Rejected | Issue will not be addressed |

### Status Transitions

Currently, status transitions are **unrestricted** - any status can transition to any other status. This allows flexibility but may be constrained by workflow rules in the future.

**Completed statuses:** `resolved`, `closed`, `rejected` - Issues with these statuses are not considered overdue even if past due date.

### Implementation Locations

**Type definitions:**
- `src/types/index.ts` - `IssueStatus` type, `statusLabels`, `allIssueStatuses`

**Server Actions:**
- `src/app/actions/issues.ts`:
  - `updateIssueStatus(issueId, status)` - Update single issue status
  - `updateIssue(id, data)` - Update issue including status
  - `bulkUpdateIssues(issueIds, data)` - Bulk update with status validation

**UI Components:**
- `src/components/ui/status-select.tsx` - Reusable status dropdown (two variants: `default` for forms, `inline` for sidebar)
- `src/app/(app)/issues/[id]/issue-sidebar.tsx` - Issue detail sidebar with inline status change
- `src/app/(app)/issues/[id]/edit/issue-edit-form.tsx` - Issue edit form with status field

### Validation

All status updates are validated against `allIssueStatuses` array. Invalid status values return an error response.
