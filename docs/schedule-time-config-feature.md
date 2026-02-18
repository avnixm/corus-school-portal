# Schedule Time Configuration Feature

## Overview
Program Heads can configure allowed time slots for class scheduling (e.g., 7:00 AM - 5:00 PM with 30-minute increments). Dean approval is required before configurations become active.

---

## Database Schema

### Table: `schedule_time_configs`
```sql
CREATE TABLE schedule_time_configs (
  id UUID PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES programs(id),
  school_year_id UUID REFERENCES school_years(id),
  term_id UUID REFERENCES terms(id),
  title VARCHAR(255) NOT NULL,
  start_hour INTEGER NOT NULL,  -- 7 = 7:00 AM
  end_hour INTEGER NOT NULL,    -- 17 = 5:00 PM
  time_increment INTEGER NOT NULL DEFAULT 30,  -- minutes
  status schedule_time_config_status NOT NULL DEFAULT 'draft',
  created_by_user_id TEXT NOT NULL,
  submitted_at TIMESTAMP,
  reviewed_by_user_id TEXT,
  reviewed_at TIMESTAMP,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Status Flow
```
draft → submitted → approved/rejected
```

---

## User Workflows

### 1. Program Head: Create Configuration

**Page:** `/program-head/schedule-time-config`

**Steps:**
1. Click "Create Time Configuration"
2. Fill out form:
   - **Title**: e.g., "Regular Schedule 2025-2026"
   - **Program**: BSIT, BSCS, etc.
   - **Start Hour**: 7 (7:00 AM)
   - **End Hour**: 17 (5:00 PM)
   - **Time Increment**: 30 minutes (dropdown: 15, 30, or 60)
3. Click "Create" → Status = "draft"
4. Click "Submit to Dean" → Status = "submitted"

**Files Created:**
- `app/(portal)/program-head/schedule-time-config/page.tsx`
- `app/(portal)/program-head/schedule-time-config/CreateTimeConfigButton.tsx`
- `app/(portal)/program-head/schedule-time-config/actions.ts`

---

### 2. Dean: Approve/Reject Configuration

**Page:** `/dean/schedule-time-config` (needs to be created)

**Steps:**
1. View submitted configurations
2. Review time range and increment
3. Approve or Reject with remarks
4. Status → "approved" or "rejected"

**Files to Create:**
- `app/(portal)/dean/schedule-time-config/page.tsx`
- `app/(portal)/dean/schedule-time-config/actions.ts`

---

### 3. Registrar: Use Time Slots in Schedule Creation

**Page:** `/registrar/schedules` (needs update)

**Current Behavior:** Free-form time input
```html
<input type="time" name="timeIn" />
<input type="time" name="timeOut" />
```

**New Behavior:** Dropdown with approved time slots
```html
<select name="timeIn">
  <option>7:00 AM</option>
  <option>7:30 AM</option>
  <option>8:00 AM</option>
  ...
  <option>4:30 PM</option>
  <option>5:00 PM</option>
</select>
```

**Logic:**
1. When section is selected → get section's program
2. Fetch `getApprovedTimeConfigForProgram(programId)`
3. Generate time slots from config
4. If no approved config → fallback to free-form input

---

## Implementation Status

✅ **Completed:**
1. Database schema (`schedule_time_configs` table)
2. Enum (`schedule_time_config_status`)
3. DB queries:
   - `createScheduleTimeConfig()`
   - `listScheduleTimeConfigs()`
   - `getApprovedTimeConfigForProgram()`
   - `submitScheduleTimeConfig()`
   - `approveScheduleTimeConfig()`
   - `rejectScheduleTimeConfig()`
4. Program Head page + actions

⏳ **Remaining:**
1. **Dean approval page** (similar to teacher capabilities)
2. **Update CreateScheduleForm**:
   - Fetch approved config based on selected section/program
   - Replace time inputs with dropdowns showing valid slots
3. **Time slot generator utility**:
   ```typescript
   function generateTimeSlots(startHour: number, endHour: number, increment: number): string[] {
     const slots = [];
     for (let hour = startHour; hour <= endHour; hour++) {
       for (let min = 0; min < 60; min += increment) {
         if (hour === endHour && min > 0) break;
         const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
         slots.push(time);
       }
     }
     return slots;
   }
   ```
4. **Run migration**: `npx drizzle-kit push`

---

## Example Use Case

**BSIT Program Schedule 2025-2026:**
- **Time Range:** 7:00 AM - 5:00 PM
- **Increment:** 30 minutes
- **Generated Slots:** 7:00, 7:30, 8:00, 8:30, ..., 4:00, 4:30, 5:00
- **Total Options:** 21 time slots

**When creating a schedule:**
- Select Section: BSIT 1 - 1-B
- System fetches approved config for BSIT
- Time In dropdown: Shows 21 options (7:00 AM - 5:00 PM)
- Time Out dropdown: Shows 21 options

**Validation:**
- Time Out must be > Time In
- Both times must be within approved range

---

## Next Steps

Run this command to apply the database changes:
```bash
cd /home/avnixm/Documents/nextprojs/askienroll
npx drizzle-kit push
```

Then create the remaining pages (Dean approval + UpdatedScheduleForm).
