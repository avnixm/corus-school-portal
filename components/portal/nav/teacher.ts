// path: components/portal/nav/teacher.ts
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  NotebookPen,
  Send,
} from "lucide-react";
import type { SidebarItem } from "../Sidebar";

export const getTeacherNavItems = (): SidebarItem[] => [
  { label: "Dashboard", href: "/teacher", icon: LayoutDashboard },
  { label: "My Classes", href: "/teacher/classes", icon: ClipboardList },
  { label: "Schedule", href: "/teacher/schedule", icon: CalendarDays },
  { label: "Gradebook", href: "/teacher/gradebook", icon: NotebookPen },
  { label: "Submissions", href: "/teacher/submissions", icon: Send },
];
