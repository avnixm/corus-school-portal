# Registrar IA Refactor

## 1) Registrar Feature Inventory (from code)

**Sources:** `app/(portal)/registrar/**`, `components/registrar/**`, `components/portal/nav/registrar.ts`

| Route | Purpose | Main entities/tables | Key actions | Current sidebar label |
|-------|---------|----------------------|-------------|------------------------|
| `/registrar` | Dashboard: counts, recent items, links to queues | enrollments, requirement submissions, grade submissions, announcements | Links to workbench, approvals, queue, grades, students, announcements | Dashboard |
| `/registrar/workbench` | Aggregate queues: enrollments, requirements, grades (top 25 each) | Same as dashboard, list views | Approve/reject enrollment; verify/reject doc; link to grade detail | Workbench |
| `/registrar/approvals` | Pending enrollment approvals list | `getPendingEnrollmentApprovalsList`, enrollment_requirements summary | Approve/reject enrollment; "Review files" → review page | Enrollment Approvals |
| `/registrar/approvals/[enrollmentId]/review` | Single enrollment review: requirement docs + approve/reject enrollment | enrollment, student, applicable requirements, requirement submissions | Verify/reject requirement submissions; request document; approve/reject enrollment | (no direct nav) |
| `/registrar/requirements` | Master requirements + rules tabs; link to queue | requirements, requirement_rules | CRUD requirements; manage rules | Requirements |
| `/registrar/requirements/queue` | Document verification queue (submissions by requirement) | `getQueueSubmissions` | Verify/reject submission (inline or link to review) | Requirements Queue |
| `/registrar/grades` | Grade submissions by status (tabs: submitted, returned, approved, released) | grade_submissions | Approve, return, release | Grade Releases |
| `/registrar/grades/[submissionId]` | Single grade submission detail | grade_submissions | Approve, return with remarks, release | (no direct nav) |
| `/registrar/students` | Students list | students | Create student; link to detail | Students |
| `/registrar/students/[id]` | Student detail + enrollments, passed forms, link to review | student, enrollments, requirement submissions | Link to enrollments, approval review | (no direct nav) |
| `/registrar/enrollments` | All enrollments with finance status | enrollments, finance | Create enrollment; assign section; link to student/review | Enrollment Records |
| `/registrar/programs` | Programs CRUD | programs | Create/edit/delete program | Programs |
| `/registrar/curriculum` | Curriculum builder (program + school year + year level) | curriculum_versions, blocks, block_subjects | Create draft/publish; add/remove subjects | Curriculum |
| `/registrar/subjects` | Subjects CRUD (program or GE) | subjects | Create/edit; filter by program | Subjects |
| `/registrar/sections` | Sections CRUD by program/year level | sections | Create/edit; filter | Sections |
| `/registrar/schedules` | Schedules list + create | schedules, sections, teachers | Create schedule; filter | Schedules |
| `/registrar/teachers` | Teachers + department + capability count | teachers, user_profiles | Edit department; view capabilities sheet | Teachers |
| `/registrar/advisers` | Adviser assignment per section (school year scoped) | sections, advisers | Assign adviser | Advisers |
| `/registrar/announcements` | Announcements list + create | announcements | Create/edit/delete; audience | Announcements |
| `/registrar/academic` | Redirect only | — | Redirect → `/registrar/subjects` | (not in nav) |
| `/registrar/pending`, `/registrar/pending/[id]` | Redirect only | — | Redirect → `/registrar` | (not in nav) |
| `/registrar/debug-teacher-capability` | Debug | — | — | (not in nav) |

**Sidebar (current):** Grouped config in `components/portal/nav/registrar.ts`: Quick Access (Dashboard, Workbench, Enrollment Approvals, Requirements Queue, Grade Releases) + Records (Students, Enrollment Records) + Academics (Programs, Curriculum, Subjects, Sections) + Operations (Schedules, Teachers, Advisers) + Content (Announcements). AppShell uses `getRegistrarNavConfig()` so Sidebar renders groups + quickAccess.

---

## 2) Similarity & Merge Analysis

- **Enrollment Approvals + Requirements Queue + Requirements (master/rules):** Same workflow: review enrollment and its requirement documents; both approvals list and queue link to the same detail screen `/registrar/approvals/[enrollmentId]/review`. Requirements page is configuration (master list + rules) for that flow. **Merge:** One module **"Approvals & Compliance"** at `/registrar/approvals` with tabs: **Enrollments** (current approvals list), **Document queue** (current requirements/queue), **Requirements** (master + rules from requirements page). Detail route stays `/registrar/approvals/[enrollmentId]/review`.

- **Students + Enrollments:** Related records (students vs enrollment records); both link to student detail and to approval review. **Merge:** One module **"Records"** at `/registrar/records` with tabs: **Students**, **Enrollments** (reuse existing table/filter components).

- **Programs + Curriculum + Subjects + Sections:** All program/subject/section setup. Academic page already redirects to subjects; AcademicSetupClient combines programs + subjects. **Merge:** One module **"Academics"** at `/registrar/academics` with tabs: **Programs**, **Curriculum**, **Subjects**, **Sections** (each tab renders existing page content or embeds existing components).

- **Teachers + Advisers:** Both are staff assignment views (teachers: department/capabilities; advisers: section-level). **Merge:** One module **"Staff"** at `/registrar/staff` with tabs: **Teachers**, **Advisers**.

- **Grades:** Already a single module (list with status tabs + detail). No merge; keep as **"Grades"** at `/registrar/grades`.

- **Schedules:** Standalone; keep as **"Scheduling"** at `/registrar/schedules`.

- **Announcements:** Standalone; keep as **"Announcements"** at `/registrar/announcements`.

- **Dashboard vs Workbench:** Dashboard shows counts and recent items; Workbench shows top-25 queues. **Merge:** Keep **Dashboard** at `/registrar` as the main landing; redirect `/registrar/workbench` → `/registrar`.

---

## 3) New Registrar Navigation (flat sidebar)

**Flat list (8 items, no groups):**

| # | Label | Route |
|---|--------|--------|
| 1 | Dashboard | `/registrar` |
| 2 | Approvals & Compliance | `/registrar/approvals` |
| 3 | Grades | `/registrar/grades` |
| 4 | Records | `/registrar/records` |
| 5 | Academics | `/registrar/academics` |
| 6 | Scheduling | `/registrar/schedules` |
| 7 | Staff | `/registrar/staff` |
| 8 | Announcements | `/registrar/announcements` |

**Route mapping (old → new):**

| Old route | New route / behavior |
|-----------|----------------------|
| `/registrar`, `/registrar/workbench` | Dashboard at `/registrar`; `/registrar/workbench` → redirect to `/registrar` |
| `/registrar/approvals` | Same path; page gains tabs: Enrollments \| Document queue \| Requirements |
| `/registrar/approvals/[enrollmentId]/review` | Unchanged |
| `/registrar/requirements` | Redirect to `/registrar/approvals?tab=requirements` |
| `/registrar/requirements/queue` | Redirect to `/registrar/approvals?tab=queue` |
| `/registrar/grades`, `/registrar/grades/[submissionId]` | Unchanged |
| `/registrar/students` | Redirect to `/registrar/records?tab=students` |
| `/registrar/students/[id]` | Unchanged (linked from Records) |
| `/registrar/enrollments` | Redirect to `/registrar/records?tab=enrollments` |
| `/registrar/programs` | Redirect to `/registrar/academics?tab=programs` |
| `/registrar/curriculum` | Redirect to `/registrar/academics?tab=curriculum` |
| `/registrar/subjects` | Redirect to `/registrar/academics?tab=subjects` |
| `/registrar/sections` | Redirect to `/registrar/academics?tab=sections` |
| `/registrar/schedules` | Unchanged |
| `/registrar/teachers` | Redirect to `/registrar/staff?tab=teachers` |
| `/registrar/advisers` | Redirect to `/registrar/staff?tab=advisers` |
| `/registrar/announcements` | Unchanged |
| `/registrar/academic` | Redirect to `/registrar/academics` |
| `/registrar/pending`, `/registrar/pending/[id]` | Redirect to `/registrar` |
