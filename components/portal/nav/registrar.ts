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
} from "lucide-react";
import type { SidebarItem } from "../Sidebar";

export const getRegistrarNavItems = (): SidebarItem[] => [
  { label: "Dashboard", href: "/registrar", icon: LayoutDashboard },
  { label: "Enrollment Approvals", href: "/registrar/approvals", icon: BadgeCheck },
  { label: "Grade Releases", href: "/registrar/grades", icon: CheckCheck },
  { label: "Students", href: "/registrar/students", icon: Users },
  { label: "Enrollment Records", href: "/registrar/enrollments", icon: ClipboardList },
  { label: "Programs", href: "/registrar/programs", icon: GraduationCap },
  { label: "Curriculum", href: "/registrar/curriculum", icon: BookMarked },
  { label: "Subjects", href: "/registrar/subjects", icon: BookOpen },
  { label: "Sections", href: "/registrar/sections", icon: Layers },
  { label: "Schedules", href: "/registrar/schedules", icon: CalendarClock },
  { label: "Requirements", href: "/registrar/requirements", icon: FileCheck },
  { label: "Announcements", href: "/registrar/announcements", icon: Megaphone },
];
