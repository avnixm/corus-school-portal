"use client";

import {
  LayoutDashboard,
  BadgeCheck,
  Users,
  ClipboardList,
  BookOpen,
  Layers,
  CalendarClock,
  FileCheck,
  Megaphone,
} from "lucide-react";
import type { SidebarItem } from "../Sidebar";

export const getRegistrarNavItems = (): SidebarItem[] => [
  { label: "Dashboard", href: "/registrar", icon: LayoutDashboard },
  { label: "Pending Applications", href: "/registrar/pending", icon: ClipboardList },
  { label: "Enrollment Approvals", href: "/registrar/approvals", icon: BadgeCheck },
  { label: "Students", href: "/registrar/students", icon: Users },
  { label: "Enrollment Records", href: "/registrar/enrollments", icon: ClipboardList },
  { label: "Subjects", href: "/registrar/subjects", icon: BookOpen },
  { label: "Sections", href: "/registrar/sections", icon: Layers },
  { label: "Schedules", href: "/registrar/schedules", icon: CalendarClock },
  { label: "Requirements", href: "/registrar/requirements", icon: FileCheck },
  { label: "Announcements", href: "/registrar/announcements", icon: Megaphone },
];
