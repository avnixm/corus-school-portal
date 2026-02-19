"use client";

import {
  LayoutDashboard,
  BadgeCheck,
  Users,
  GraduationCap,
  CalendarClock,
  Megaphone,
  CheckCheck,
  UserCog,
} from "lucide-react";
import type { SidebarItem } from "../Sidebar";

/** Flat registrar sidebar (8 items, no groups). */
export const getRegistrarNavItems = (): SidebarItem[] => [
  { label: "Dashboard", href: "/registrar", icon: LayoutDashboard },
  { label: "Approvals & Compliance", href: "/registrar/approvals", icon: BadgeCheck },
  { label: "Grades", href: "/registrar/grades", icon: CheckCheck },
  { label: "Records", href: "/registrar/records", icon: Users },
  { label: "Academics", href: "/registrar/academics", icon: GraduationCap },
  { label: "Scheduling", href: "/registrar/schedules", icon: CalendarClock },
  { label: "Staff", href: "/registrar/staff", icon: UserCog },
  { label: "Announcements", href: "/registrar/announcements", icon: Megaphone },
];
