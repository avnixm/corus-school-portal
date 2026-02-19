# Redirect-Only Pages Cleanup

## Inventory: oldPath → target → decision

| Old path | Redirect target | Decision |
|----------|-----------------|----------|
| `/registrar/requirements` | `/registrar/approvals?tab=requirements` | Render directly at `/registrar/approvals/requirements` |
| `/registrar/requirements/queue` | `/registrar/approvals?tab=queue` | Render directly at `/registrar/approvals/queue` |
| `/registrar/students` | `/registrar/records?tab=students` (+ query) | Render directly at `/registrar/records/students` |
| `/registrar/enrollments` | `/registrar/records?tab=enrollments` (+ query) | Render directly at `/registrar/records/enrollments` |
| `/registrar/programs` | `/registrar/academics?tab=programs` (+ query) | Render directly at `/registrar/academics/programs` |
| `/registrar/subjects` | `/registrar/academics?tab=subjects` (+ query) | Render directly at `/registrar/academics/subjects` |
| `/registrar/sections` | `/registrar/academics?tab=sections` (+ query) | Render directly at `/registrar/academics/sections` |
| `/registrar/teachers` | `/registrar/staff?tab=teachers` | Render directly at `/registrar/staff/teachers` |
| `/registrar/advisers` | `/registrar/staff?tab=advisers` (+ query) | Render directly at `/registrar/staff/advisers` |
| `/registrar/workbench` | `/registrar` | Keep redirect (next.config) |
| `/registrar/academic` | `/registrar/academics` | Keep redirect (next.config) |
| `/registrar/pending` | `/registrar` | Keep redirect (next.config) |
| `/registrar/pending/[id]` | `/registrar` | Keep redirect (next.config) |

## Proposed canonical routes

- **Approvals:** `/registrar/approvals`, `/registrar/approvals/queue`, `/registrar/approvals/requirements`
- **Records:** `/registrar/records`, `/registrar/records/students`, `/registrar/records/enrollments`
- **Academics:** `/registrar/academics`, `/registrar/academics/programs`, `/registrar/academics/curriculum`, `/registrar/academics/subjects`, `/registrar/academics/sections`
- **Staff:** `/registrar/staff`, `/registrar/staff/teachers`, `/registrar/staff/advisers`

## Files deleted

- `app/(portal)/registrar/requirements/page.tsx`
- `app/(portal)/registrar/requirements/queue/page.tsx`
- `app/(portal)/registrar/students/page.tsx`
- `app/(portal)/registrar/enrollments/page.tsx`
- `app/(portal)/registrar/programs/page.tsx`
- `app/(portal)/registrar/subjects/page.tsx`
- `app/(portal)/registrar/sections/page.tsx`
- `app/(portal)/registrar/teachers/page.tsx`
- `app/(portal)/registrar/advisers/page.tsx`
- `app/(portal)/registrar/workbench/page.tsx`
- `app/(portal)/registrar/academic/page.tsx`
- `app/(portal)/registrar/pending/page.tsx`
- `app/(portal)/registrar/pending/[id]/page.tsx`

## Files created

- `app/(portal)/registrar/approvals/queue/page.tsx`
- `app/(portal)/registrar/approvals/requirements/page.tsx`
- `app/(portal)/registrar/records/students/page.tsx`
- `app/(portal)/registrar/records/enrollments/page.tsx`
- `app/(portal)/registrar/academics/programs/page.tsx`
- `app/(portal)/registrar/academics/curriculum/page.tsx`
- `app/(portal)/registrar/academics/subjects/page.tsx`
- `app/(portal)/registrar/academics/sections/page.tsx`
- `app/(portal)/registrar/staff/teachers/page.tsx`
- `app/(portal)/registrar/staff/advisers/page.tsx`

## Files modified

- `app/(portal)/registrar/approvals/page.tsx` — tab links to canonical paths; optional shared tab exports
- `app/(portal)/registrar/records/page.tsx` — tab links to canonical paths
- `app/(portal)/registrar/academics/page.tsx` — tab links to canonical paths
- `app/(portal)/registrar/staff/page.tsx` — tab links to canonical paths
- `app/(portal)/registrar/page.tsx` — hrefs to canonical paths
- `app/(portal)/registrar/students/[id]/page.tsx` — link to `/registrar/records/students`
- `app/(portal)/registrar/students/DeleteStudentButton.tsx` — redirect to `/registrar/records/students`
- `app/(portal)/registrar/requirements/queue/QueueFilters.tsx` — basePath for `/registrar/approvals/queue`
- `next.config.ts` — add `redirects()`
