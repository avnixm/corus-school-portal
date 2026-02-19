# Redirect-Only Pages Cleanup

## Inventory: oldPath → target → decision

| Old path | Redirect target | Decision |
|----------|-----------------|----------|
| **Registrar** (already in next.config; no page files) | | |
| `/registrar/requirements` | `/registrar/approvals/requirements` | next.config redirect |
| `/registrar/requirements/queue` | `/registrar/approvals/queue` | next.config redirect |
| `/registrar/students` | `/registrar/records/students` | next.config redirect |
| `/registrar/enrollments` | `/registrar/records/enrollments` | next.config redirect |
| `/registrar/programs` | `/registrar/academics/programs` | next.config redirect |
| `/registrar/subjects` | `/registrar/academics/subjects` | next.config redirect |
| `/registrar/sections` | `/registrar/academics/sections` | next.config redirect |
| `/registrar/academic` | `/registrar/academics` | next.config redirect |
| `/registrar/teachers` | `/registrar/staff/teachers` | next.config redirect |
| `/registrar/advisers` | `/registrar/staff/advisers` | next.config redirect |
| `/registrar/workbench` | `/registrar` | next.config redirect |
| `/registrar/pending` | `/registrar` | next.config redirect |
| `/registrar/pending/:id` | `/registrar` | next.config redirect |
| **Dean** (redirect-only page files → next.config) | | |
| `/dean/fees` | `/dean/approvals?tab=feeSetups` | next.config redirect, delete page |
| `/dean/schedules` | `/dean/approvals?tab=schedules` | next.config redirect, delete page |
| `/dean/schedule-time-config` | `/dean/approvals?tab=timeConfig` | next.config redirect, delete page |
| `/dean/teacher-capabilities` | `/dean/approvals?tab=capabilities` | next.config redirect, delete page |
| `/dean/fees/:feeSetupId` | `/dean/approvals/feeSetups/:feeSetupId` | next.config redirect, delete page |
| `/dean/teacher-capabilities/:packageId` | `/dean/approvals/capabilities/:packageId` | next.config redirect, delete page |
| **Program head** (redirect-only page files → middleware) | | |
| `/program-head/classes` | `/program-head/sections` (+ query) | middleware redirect, delete page |
| `/program-head/fees` | `/program-head/finance?view=fees` | next.config redirect, delete page |
| `/program-head/clearance` | `/program-head/finance?view=clearance` (+ query) | middleware redirect, delete page |
| `/program-head/schedules` | `/program-head/scheduling?view=schedules` (+ query) | middleware redirect, delete page |
| `/program-head/schedule-time-config` | `/program-head/scheduling?view=time-config` | next.config redirect, delete page |
| `/program-head/submissions` | `/program-head/grades?view=submissions` (+ query) | middleware redirect, delete page |
| **Student** (redirect-only page files → next.config) | | |
| `/student/setup` | `/student/complete-profile` | next.config redirect, delete page |
| `/student/pending-approval` | `/student/complete-profile` | next.config redirect, delete page |

## Proposed canonical routes (sidebar / internal links)

- **Registrar:** `/registrar/approvals`, `/registrar/approvals/queue`, `/registrar/approvals/requirements`, `/registrar/records`, `/registrar/academics`, `/registrar/academics/curriculum`, `/registrar/staff`, etc.
- **Dean:** `/dean/approvals`, `/dean/approvals?tab=*`, `/dean/approvals/:type/:id`.
- **Program head:** `/program-head/sections`, `/program-head/scheduling`, `/program-head/finance`, `/program-head/grades` (nav already uses these).
- **Student:** `/student/complete-profile` (canonical for onboarding).

## Files deleted

- `app/(portal)/dean/fees/page.tsx`
- `app/(portal)/dean/schedules/page.tsx`
- `app/(portal)/dean/schedule-time-config/page.tsx`
- `app/(portal)/dean/teacher-capabilities/page.tsx`
- `app/(portal)/dean/fees/[feeSetupId]/page.tsx`
- `app/(portal)/dean/teacher-capabilities/[packageId]/page.tsx`
- `app/(portal)/program-head/classes/page.tsx`
- `app/(portal)/program-head/fees/page.tsx`
- `app/(portal)/program-head/clearance/page.tsx`
- `app/(portal)/program-head/schedules/page.tsx`
- `app/(portal)/program-head/schedule-time-config/page.tsx`
- `app/(portal)/program-head/submissions/page.tsx`
- `app/(portal)/student/setup/page.tsx`
- `app/(portal)/student/pending-approval/page.tsx`

## Files modified

- `next.config.ts` — add dean, program-head (fees, schedule-time-config), and student redirects; dean dynamic segment redirects.
- `middleware.ts` — add program-head path redirects (classes, clearance, schedules, submissions) with query preservation.
- `app/(portal)/program-head/page.tsx` — dashboard links to canonical `/program-head/grades?view=submissions`, `/program-head/finance?view=clearance`.
- `app/(portal)/program-head/clearance/[enrollmentId]/page.tsx` — back link to `/program-head/finance?view=clearance`.
- `app/(portal)/program-head/clearance/ClearanceFilters.tsx` — default `basePath` to `/program-head/finance`.
- `app/(portal)/program-head/classes/ClassManagementFilters.tsx` — push to `/program-head/sections`.
- `app/(portal)/program-head/submissions/SubmissionsFilters.tsx` — push to `/program-head/grades?view=submissions`.
- `app/actions/pendingStudents.ts` — redirect to `/student/complete-profile`.
- `app/(portal)/dean/fees/DeanFeeApprovalActions.tsx` — push to `/dean/approvals?tab=feeSetups`.
- `app/(portal)/dean/fees/DeanFeeApprovalRow.tsx` — link to `/dean/approvals/feeSetups/:id`.
- `app/(portal)/dean/teacher-capabilities/[packageId]/DeanCapabilityReview.tsx` — push to `/dean/approvals?tab=capabilities`.
- `app/(portal)/dean/teacher-capabilities/DeanCapabilityTabs.tsx` — link to `/dean/approvals/capabilities/:id`.
