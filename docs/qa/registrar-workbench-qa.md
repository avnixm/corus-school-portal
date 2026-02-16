# Registrar Workbench QA Checklist

## Overview
Manual QA checklist for the Registrar Workbench improvements. Test all features in the order listed to ensure proper functionality and integration.

**Test Environment:** Development/Staging  
**Tester:** _____________  
**Date:** _____________  
**Test Pass:** ☐ Yes ☐ No (with notes)

---

## Phase A: Registrar Workbench Page

### Access & Navigation
- [ ] Navigate to `/registrar` dashboard
- [ ] Verify "Open Workbench →" button appears in the header
- [ ] Click button and confirm navigation to `/registrar/workbench`
- [ ] Verify sidebar shows "Workbench" menu item
- [ ] Click sidebar link and confirm navigation works

### Summary Cards
- [ ] Verify three summary cards display:
  - [ ] Enrollment Approvals (with count)
  - [ ] Requirements to Verify (with count)
  - [ ] Grade Submissions (with count)
- [ ] Verify each card has a "View all/View queue" link
- [ ] Click each link and verify navigation to correct page

### Tab Functionality
- [ ] Verify three tabs appear: Enrollments | Requirements | Grades
- [ ] Default tab is "Enrollments"
- [ ] Click each tab and verify it switches correctly
- [ ] Verify tab count badges show correct numbers

### Enrollments Tab
- [ ] Verify table columns: Age, Student, Program, Year Level, Requirements, Actions
- [ ] Verify Age badges display with appropriate colors (New/days)
- [ ] Verify student names are clickable links
- [ ] Verify requirements show "X/Y verified" format
- [ ] Verify "Review →" link navigates to enrollment review
- [ ] Verify empty state message if no enrollments
- [ ] Verify "View all X enrollments →" link at bottom (if items exist)

### Requirements Tab
- [ ] Verify table columns: Age, Student, Requirement, Program/Year, Actions
- [ ] Verify Age badges display correctly
- [ ] Verify student and requirement data displays
- [ ] Verify "Verify →" link navigates to queue
- [ ] Verify empty state message if no submissions

### Grades Tab
- [ ] Verify table columns: Age, Subject, Section, Period, Teacher, Actions
- [ ] Verify Age badges display correctly
- [ ] Verify grade submission details display
- [ ] Verify "Review →" link navigates to submission page
- [ ] Verify empty state message if no submissions

---

## Phase B: SLA/Age Badges

### Enrollment Approvals Page (`/registrar/approvals`)
- [ ] Verify new "Age" column appears as first column
- [ ] Verify badge variants:
  - [ ] 0-2 days: "Today", "1d", "2d" (default variant)
  - [ ] 3-6 days: "3d", "4d", "5d", "6d" (secondary variant - amber-ish)
  - [ ] 7+ days: "7d", "8d", etc. (destructive variant - red)
- [ ] Create test enrollment and verify age updates correctly
- [ ] Verify colSpan updated to 10 in empty state row

### Requirements Queue (`/registrar/requirements/queue`)
- [ ] Verify new "Age" column appears as first column
- [ ] Verify badges use same color scheme as above
- [ ] Verify age calculated from `submittedAt` date
- [ ] Verify colSpan updated to 7 in empty state row

### Grades List (`/registrar/grades`)
- [ ] Verify Age badge appears in each grade submission card
- [ ] Verify badge positioned between subject info and status badge
- [ ] Verify age calculated from `submittedAt` date
- [ ] Verify color scheme matches other pages

---

## Phase C: Finance Hold Guard

### Server Action Validation
- [ ] Create test student with active finance hold
- [ ] Navigate to enrollment review for that student
- [ ] Attempt to approve enrollment
- [ ] Verify error message: "Student has an active Finance Hold. Ask Finance to clear it before approval."
- [ ] Verify enrollment status remains `pending_approval`

### UI Feedback
- [ ] Verify error displays in toast notification
- [ ] Verify inline alert/banner shows finance hold warning
- [ ] Verify alert includes "Finance Hold Active" message

### Review Page Header
- [ ] Navigate to enrollment review page for student with hold
- [ ] Verify red alert banner displays below student info
- [ ] Verify banner includes:
  - [ ] AlertTriangle icon
  - [ ] Message: "Finance Hold Active — Approval blocked until Finance clears hold"
  - [ ] Red styling (border, background, text)

### Clearance Flow
- [ ] Have finance clear the hold
- [ ] Refresh enrollment review page
- [ ] Verify banner no longer appears
- [ ] Attempt approval and verify it succeeds

---

## Phase D: Requirements Queue Context

### Enrollment Context Display
- [ ] Open requirements queue (`/registrar/requirements/queue`)
- [ ] Verify new "Enrollment" column appears
- [ ] Verify enrollment status badge displays:
  - [ ] `pending_approval`: secondary variant
  - [ ] `approved`: default variant
  - [ ] Other statuses: outline variant
- [ ] Verify "View" link appears below badge
- [ ] Click "View" link and verify navigation to `/registrar/approvals/[enrollmentId]/review`

### Filters
- [ ] Verify new "Enrollment status" filter dropdown appears
- [ ] Verify options:
  - [ ] All
  - [ ] Pending approval
  - [ ] Approved
  - [ ] Rejected
- [ ] Select "Pending approval" and verify results filter correctly
- [ ] Select "Approved" and verify results update
- [ ] Verify filter persists in URL (check searchParams)
- [ ] Combine with existing filters (Program, Term, Search)
- [ ] Verify multiple filters work together

### Table Column Count
- [ ] Verify colSpan for empty state row updated to 7

---

## Phase E: Enrollment Approvals Filters

### Filter Bar UI
- [ ] Open enrollment approvals page (`/registrar/approvals`)
- [ ] Verify filter bar card displays with 4 inputs:
  - [ ] Program dropdown
  - [ ] Year level dropdown
  - [ ] Requirements filter dropdown
  - [ ] Search input with button

### Program Filter
- [ ] Click Program dropdown
- [ ] Verify "All programs" option appears first
- [ ] Verify all active programs listed
- [ ] Select a program and verify results filter
- [ ] Verify URL updates with `program` param
- [ ] Select "All programs" and verify filter clears

### Year Level Filter
- [ ] Click Year level dropdown
- [ ] Verify options: All, 1st Year, 2nd Year, 3rd Year, 4th Year
- [ ] Select "2nd Year" and verify results filter
- [ ] Verify URL updates with `yearLevel` param

### Requirements Status Filter
- [ ] Click Requirements dropdown
- [ ] Verify options: All, Complete, Incomplete
- [ ] Select "Complete" and verify only enrollments with all verified reqs show
- [ ] Select "Incomplete" and verify only enrollments with missing reqs show
- [ ] Verify URL updates with `reqsStatus` param

### Search
- [ ] Enter student name in search input
- [ ] Click "Search" button
- [ ] Verify results filter by name
- [ ] Try student code/number search
- [ ] Verify URL updates with `search` param

### Combined Filters
- [ ] Set Program = "BSCS"
- [ ] Set Year level = "3rd Year"
- [ ] Set Requirements = "Incomplete"
- [ ] Enter search term
- [ ] Verify all filters apply simultaneously
- [ ] Verify URL contains all params
- [ ] Refresh page and verify filters persist
- [ ] Clear each filter and verify results update

### Table Updates
- [ ] Verify Age column appears (from Phase B)
- [ ] Verify colSpan for empty state updated to 10

---

## Phase F: Grades Queue Quick Actions

### Row Actions
- [ ] Open grades page (`/registrar/grades`)
- [ ] Navigate to "Submitted" tab
- [ ] Verify each row displays inline action buttons:
  - [ ] "Approve" button (blue outline)
  - [ ] "Approve & Release" button (maroon solid)

### Approve Action
- [ ] Click "Approve" on a submitted grade
- [ ] Verify button shows loading state
- [ ] Verify status updates to `approved`
- [ ] Verify page refreshes/revalidates
- [ ] Verify grade moves to "Approved" tab

### Approve & Release Action
- [ ] Submit a new grade
- [ ] Click "Approve & Release" button
- [ ] Verify loading state
- [ ] Verify status updates directly to `released`
- [ ] Verify grade appears in "Released" tab
- [ ] Verify students can now see the grade

### Release Action (Approved Tab)
- [ ] Navigate to "Approved" tab
- [ ] Verify "Release" button appears for approved grades
- [ ] Click "Release"
- [ ] Verify status updates to `released`
- [ ] Verify grade moves to "Released" tab

### No Actions (Other Tabs)
- [ ] Navigate to "Returned" tab
- [ ] Verify no action buttons appear
- [ ] Navigate to "Released" tab
- [ ] Verify no action buttons appear

### History Section (Review Page)
- [ ] Click a grade submission link to open review page
- [ ] Scroll to bottom
- [ ] Verify "History" card appears with Clock icon
- [ ] Verify audit log entries display:
  - [ ] Action name
  - [ ] Timestamp
  - [ ] Remarks (if present)
- [ ] Perform an action (Approve/Return/Release)
- [ ] Refresh and verify new entry appears in history
- [ ] Verify entries ordered by most recent first

---

## General Integration Tests

### End-to-End: Enrollment Flow with All Features
1. [ ] Create new enrollment as student
2. [ ] Submit required documents
3. [ ] Open workbench as registrar
4. [ ] Verify enrollment appears in Enrollments tab
5. [ ] Verify Age badge shows "Today" or "1d"
6. [ ] Verify requirement appears in Requirements tab
7. [ ] Use filters to find the enrollment
8. [ ] Check for finance hold (verify badge if present)
9. [ ] Approve enrollment
10. [ ] Verify enrollment disappears from workbench

### End-to-End: Requirements Flow
1. [ ] Student submits requirement
2. [ ] Open requirements queue
3. [ ] Verify Age badge appears
4. [ ] Verify enrollment context displays
5. [ ] Use filters to find submission
6. [ ] Click "View" link to enrollment review
7. [ ] Return to queue
8. [ ] Verify/reject submission
9. [ ] Verify queue updates

### End-to-End: Grades Flow
1. [ ] Teacher submits grades
2. [ ] Open grades page
3. [ ] Verify submission in "Submitted" tab
4. [ ] Verify Age badge appears
5. [ ] Click "Approve & Release" from table
6. [ ] Verify grade immediately released
7. [ ] Check history section on review page
8. [ ] Verify student can see grade

### Performance & UX
- [ ] All pages load within 2 seconds
- [ ] Filters respond immediately (<500ms)
- [ ] No console errors in browser
- [ ] No layout shifts or flickers
- [ ] All links and buttons work on first click
- [ ] Loading states display for async actions
- [ ] Error messages are clear and actionable

---

## Browser Compatibility

Test in the following browsers:

### Desktop
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile (if applicable)
- [ ] iOS Safari
- [ ] Android Chrome

---

## Accessibility

- [ ] All interactive elements keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA standards
- [ ] Screen reader announces status changes
- [ ] Error messages associated with inputs

---

## Notes & Issues

### Issues Found:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Recommendations:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

## Sign-off

**Tester Signature:** _____________  
**Date:** _____________  
**Status:** ☐ PASS ☐ FAIL (requires fixes)

**Registrar Approval:** _____________  
**Date:** _____________
