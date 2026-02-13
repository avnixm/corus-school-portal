# CORUS Schema Mapping (Legacy → New)

This document summarizes how the legacy `tbl_*` tables map into the new
Drizzle/Postgres schema used by the CORUS portal.

## Identity & People

- `tbl_users` → `user_profile` + `students` / `teachers`
  - `user_id` → `user_profile.user_id` (auth user id)
  - `fullname` → `user_profile.full_name`
  - `email` → `user_profile.email`
  - `role` → `user_profile.role`

- `tbl_studentinfo` → `students`
  - `student_id` → `students.student_code`
  - `first_name` / `middle_name` / `last_name` → same-named columns
  - `birthday` → `students.birthday`
  - `schoolyear` → linked via `school_years.name`

- `tbl_teachers` → `teachers`
  - `teacher_id` → `teachers.teacher_code`
  - `firstname` / `lastname` → `first_name` / `last_name`
  - `email` → `teachers.email`

## Academic Setup & Curriculum

- `tbl_school_year` → `school_years`
  - `schoolyearid` → `school_years.id` (new UUID)
  - `schoolyear` → `school_years.name`

- `tbl_term` → `terms`
  - `termid` → `terms.id` (new UUID)
  - `term` → `terms.name`

- `tbl_subject_list` → `subjects`
  - `subject_id` → `subjects.id` (new UUID)
  - `subject_code` → `subjects.code`
  - `subject_desc` → `subjects.description`

- `tbl_section` → `sections`
  - `section_id` → `sections.id` (new UUID)
  - `section` → `sections.name`

## Scheduling

- `tbl_schedule` → `class_schedules`
  - `schedule_id` → `class_schedules.id` (new UUID)
  - `schoolyear` → `school_year_id`
  - `term` → `term_id`
  - `section_id`, `subject_id`, `teacher_id` → FKs to new tables
  - `time_in`, `time_out`, `room` → same-named columns

- `tbl_schedule_day` → `schedule_days`
  - `scheduleday_id` → `schedule_days.id` (new UUID)
  - `schedule_id` → `schedule_days.schedule_id`
  - `day` → `schedule_days.day`

## Enrollment

- `tbl_enrolled_student` → `enrollments`
  - `enrollid` → `enrollments.id` (new UUID)
  - `student_id` → `enrollments.student_id`
  - `schoolyear` → `enrollments.school_year_id`
  - `semester` → `enrollments.term_id`
  - `course`, `yearlevel`, `status` → same-named columns

- `tbl_enrolled_student_approvals` → `enrollment_approvals`
  - `approval_id` → `enrollment_approvals.id` (new UUID)
  - `enrollid` → `enrollment_approvals.enrollment_id`

- `tbl_shifted_student` → `student_shifts`

- `tbl_student_requirement_checklist*` → `student_requirements`
  - Year-suffixed duplicates are collapsed into a single table with
    `school_year_id` / `term_id`.

## Grades

- `tbl_gradetype` → `grade_types`
- `tbl_shs_grade` → `grades` (with `level = 'shs'`)
- `tbl_jhs_grade` → `grades` (with `level = 'jhs'`)
- `tbl_cert_grades` → `grade_certifications`

## Billing

- `tbl_program_fees` → `program_fees`
- `tbl_enrolled_payment_fees` → `student_fee_ledgers`
- `tbl_preregistration_payment_fees` → `preregistration_fee_ledgers`

Archive, history, temp, and year-suffixed reporting tables are intentionally
not represented in the new schema; reporting can be handled with SQL views
over these core tables.

