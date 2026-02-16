# Registrar Sidebar Improvements

## Overview
Reorganized the Registrar sidebar navigation to reduce clutter with collapsible groups and smooth animations.

## Changes Implemented

### 1. New Information Architecture

#### Quick Access (Always Visible)
- Dashboard
- Workbench  
- Enrollment Approvals
- Requirements Queue
- Grade Releases

#### Collapsible Groups
- **Records**: Students, Enrollment Records
- **Academics**: Programs, Curriculum, Subjects, Sections
- **Operations**: Schedules, Teachers, Advisers
- **Content**: Announcements

### 2. Key Features

✅ **Collapsible Groups**: All groups can be collapsed/expanded, even when containing the active route
✅ **Smooth Animations**: 300ms ease-in-out transitions with fade and height animations
✅ **LocalStorage Persistence**: Group states are remembered across sessions
✅ **Smart Initial State**: Groups auto-expand on first load if they contain the active route
✅ **Visual Feedback**: 
- Active group headers highlighted in maroon
- Smooth chevron rotation animation
- Active routes highlighted within groups

### 3. Files Modified

#### `/components/portal/Sidebar.tsx`
- Added `SidebarGroup` and `SidebarConfig` types
- Created `SidebarGroupComponent` with Radix Collapsible
- Added localStorage persistence for group states
- Implemented smooth animations for expand/collapse
- Added visual indicator for active group (maroon color)
- Added dynamic `portalLabel` prop to display correct portal name
- Backward compatible with legacy flat list

#### `/components/portal/nav/registrar.ts`
- Added `getRegistrarNavConfig()` function with grouped structure
- Kept legacy `getRegistrarNavItems()` for compatibility
- Updated "Requirements" to "Requirements Queue" pointing to `/registrar/requirements/queue`

#### `/components/portal/AppShell.tsx`
- Updated to support both old `items` and new `config` props
- Registrar variant now uses `getRegistrarNavConfig()`
- Added dynamic `portalLabel` based on `navVariant` or `role`
  - Registrar → "Registrar Portal"
  - Finance → "Finance Portal"
  - Teacher → "Teacher Portal"
  - Program Head → "Program Head Portal"
  - Dean → "Dean Portal"
  - Admin → "Admin Portal"
  - Student → "Student Portal" (default)
- Other portals continue using flat structure

#### `/app/globals.css`
- Added `collapsible-down` and `collapsible-up` keyframe animations
- Animations include height and opacity transitions
- Uses Radix Collapsible CSS variables for smooth height calculations

### 4. Animation Details

```css
@keyframes collapsible-down {
  from {
    height: 0;
    opacity: 0;
  }
  to {
    height: var(--radix-collapsible-content-height);
    opacity: 1;
  }
}

@keyframes collapsible-up {
  from {
    height: var(--radix-collapsible-content-height);
    opacity: 1;
  }
  to {
    height: 0;
    opacity: 0;
  }
}
```

- Duration: 300ms
- Easing: ease-out
- Animates both height and opacity for smooth transitions
- Chevron icon rotates 90° with 300ms ease-in-out

### 5. User Experience Improvements

**Before**: 15 items at the same flat level - cluttered and overwhelming

**After**: 
- 5 Quick Access items always visible
- 10 items organized into 4 collapsible groups
- Cleaner, more scannable interface
- Groups can be collapsed even when browsing items within them
- Smooth, professional animations

### 6. Technical Implementation

**localStorage Key**: `registrar_sidebar_groups`

**Storage Format**:
```json
{
  "records": true,
  "academics": false,
  "operations": false,
  "content": false
}
```

**State Management**:
- Initial load: Auto-expand groups containing active route
- User interaction: Saved to localStorage immediately
- Subsequent loads: Use saved state
- User can collapse even active groups for minimal view

### 7. Accessibility
- Uses Radix UI Collapsible for proper ARIA attributes
- Keyboard navigable
- Screen reader friendly
- Focus management handled by Radix

## Testing
To test the new sidebar:
1. Navigate to any registrar page (e.g., `/registrar`)
2. Click group headers to collapse/expand
3. Navigate to different pages within a group
4. Verify smooth animations
5. Refresh page to confirm state persistence
6. Try collapsing a group that contains your current page

## Future Enhancements (Optional)
- Add badge counts for Approvals, Requirements Queue, and Grade Releases
- Add group icons for visual hierarchy
- Support keyboard shortcuts (e.g., Cmd+1 for Quick Access)
- Add "Collapse All" / "Expand All" button in sidebar footer
