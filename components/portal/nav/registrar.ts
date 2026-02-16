"use client";

import {
  LayoutDashboard,
  BadgeCheck,
  Users,
  ClipboardList,
  BookOpen,
  Layers,
  GraduationCap,
  CalendarClock,
  FileCheck,
  Megaphone,
  CheckCheck,
  BookMarked,
  UserCog,
  UserCheck,
} from "lucide-react";
import type { SidebarItem, SidebarConfig } from "../Sidebar";

// Legacy flat list (kept for compatibility)
export const getRegistrarNavItems = (): SidebarItem[] => [
  { label: "Dashboard", href: "/registrar", icon: LayoutDashboard },
  { label: "Workbench", href: "/registrar/workbench", icon: BadgeCheck },
  { label: "Enrollment Approvals", href: "/registrar/approvals", icon: BadgeCheck },
  { label: "Grade Releases", href: "/registrar/grades", icon: CheckCheck },
  { label: "Students", href: "/registrar/students", icon: Users },
  { label: "Enrollment Records", href: "/registrar/enrollments", icon: ClipboardList },
  { label: "Programs", href: "/registrar/programs", icon: GraduationCap },
  { label: "Curriculum", href: "/registrar/curriculum", icon: BookMarked },
  { label: "Subjects", href: "/registrar/subjects", icon: BookOpen },
  { label: "Sections", href: "/registrar/sections", icon: Layers },
  { label: "Advisers", href: "/registrar/advisers", icon: UserCheck },
  { label: "Schedules", href: "/registrar/schedules", icon: CalendarClock },
  { label: "Teachers", href: "/registrar/teachers", icon: UserCog },
  { label: "Requirements", href: "/registrar/requirements", icon: FileCheck },
  { label: "Announcements", href: "/registrar/announcements", icon: Megaphone },
];

// New grouped configuration
export const getRegistrarNavConfig = (): SidebarConfig => ({
  quickAccess: [
    { label: "Dashboard", href: "/registrar", icon: LayoutDashboard },
    { label: "Workbench", href: "/registrar/workbench", icon: BadgeCheck },
    { label: "Enrollment Approvals", href: "/registrar/approvals", icon: BadgeCheck },
    { label: "Requirements Queue", href: "/registrar/requirements/queue", icon: FileCheck },
    { label: "Grade Releases", href: "/registrar/grades", icon: CheckCheck },
  ],
  groups: [
    {
      key: "records",
      title: "Records",
      defaultOpen: false,
      items: [
        { label: "Students", href: "/registrar/students", icon: Users },
        { label: "Enrollment Records", href: "/registrar/enrollments", icon: ClipboardList },
      ],
    },
    {
      key: "academics",
      title: "Academics",
      defaultOpen: false,
      items: [
        { label: "Programs", href: "/registrar/programs", icon: GraduationCap },
        { label: "Curriculum", href: "/registrar/curriculum", icon: BookMarked },
        { label: "Subjects", href: "/registrar/subjects", icon: BookOpen },
        { label: "Sections", href: "/registrar/sections", icon: Layers },
      ],
    },
    {
      key: "operations",
      title: "Operations",
      defaultOpen: false,
      items: [
        { label: "Schedules", href: "/registrar/schedules", icon: CalendarClock },
        { label: "Teachers", href: "/registrar/teachers", icon: UserCog },
        { label: "Advisers", href: "/registrar/advisers", icon: UserCheck },
      ],
    },
    {
      key: "content",
      title: "Content",
      defaultOpen: false,
      items: [
        { label: "Announcements", href: "/registrar/announcements", icon: Megaphone },
      ],
    },
  ],
});
