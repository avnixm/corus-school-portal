import {
  LayoutDashboard,
  UsersRound,
  BarChart3,
  ClipboardCheck,
  ShieldCheck,
  BadgeDollarSign,
  Layers,
  Megaphone,
  Settings,
  BookOpen,
  CalendarCheck,
  Clock,
  Zap,
} from "lucide-react";
import type { SidebarItem, SidebarConfig } from "../Sidebar";

// Legacy flat list (kept for compatibility)
export const getProgramHeadNavItems = (): SidebarItem[] => [
  { label: "Dashboard", href: "/program-head", icon: LayoutDashboard },
  { label: "Enrollment Analytics", href: "/program-head/enrollments", icon: UsersRound },
  { label: "Smart Sectioning", href: "/program-head/sectioning", icon: Zap },
  { label: "Grade Analytics", href: "/program-head/grades", icon: BarChart3 },
  { label: "Grade Submissions", href: "/program-head/submissions", icon: ClipboardCheck },
  { label: "Finance Clearance", href: "/program-head/clearance", icon: ShieldCheck },
  { label: "Fee Approvals", href: "/program-head/fees", icon: BadgeDollarSign },
  { label: "Teacher Capabilities", href: "/program-head/teacher-capabilities", icon: BookOpen },
  { label: "Schedules", href: "/program-head/schedules", icon: CalendarCheck },
  { label: "Schedule Time Config", href: "/program-head/schedule-time-config", icon: Clock },
  { label: "Sections & Loads", href: "/program-head/sections", icon: Layers },
  { label: "Announcements", href: "/program-head/announcements", icon: Megaphone },
  { label: "Settings", href: "/program-head/settings", icon: Settings },
];

// Grouped configuration for cleaner sidebar
export const getProgramHeadNavConfig = (): SidebarConfig => ({
  quickAccess: [
    { label: "Dashboard", href: "/program-head", icon: LayoutDashboard },
    { label: "Smart Sectioning", href: "/program-head/sectioning", icon: Zap },
    { label: "Enrollment Analytics", href: "/program-head/enrollments", icon: UsersRound },
  ],
  groups: [
    {
      key: "scheduling",
      title: "Scheduling",
      defaultOpen: false,
      items: [
        { label: "Schedules", href: "/program-head/schedules", icon: CalendarCheck },
        { label: "Schedule Time Config", href: "/program-head/schedule-time-config", icon: Clock },
        { label: "Sections & Loads", href: "/program-head/sections", icon: Layers },
      ],
    },
    {
      key: "grades",
      title: "Grades",
      defaultOpen: false,
      items: [
        { label: "Grade Analytics", href: "/program-head/grades", icon: BarChart3 },
        { label: "Grade Submissions", href: "/program-head/submissions", icon: ClipboardCheck },
      ],
    },
    {
      key: "finance",
      title: "Finance",
      defaultOpen: false,
      items: [
        { label: "Finance Clearance", href: "/program-head/clearance", icon: ShieldCheck },
        { label: "Fee Approvals", href: "/program-head/fees", icon: BadgeDollarSign },
      ],
    },
    {
      key: "more",
      title: "More",
      defaultOpen: false,
      items: [
        { label: "Teacher Capabilities", href: "/program-head/teacher-capabilities", icon: BookOpen },
        { label: "Announcements", href: "/program-head/announcements", icon: Megaphone },
        { label: "Settings", href: "/program-head/settings", icon: Settings },
      ],
    },
  ],
});
