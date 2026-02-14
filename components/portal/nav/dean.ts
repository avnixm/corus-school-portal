import {
  LayoutDashboard,
  UsersRound,
  GraduationCap,
  BadgeDollarSign,
  FileCheck,
  Radar,
  Megaphone,
  ShieldAlert,
  Settings,
  CalendarCheck,
} from "lucide-react";
import type { SidebarItem } from "../Sidebar";

export const getDeanNavItems = (): SidebarItem[] => [
  { label: "Dashboard", href: "/dean", icon: LayoutDashboard },
  { label: "Enrollment Overview", href: "/dean/enrollments", icon: UsersRound },
  { label: "Academic Outcomes", href: "/dean/academics", icon: GraduationCap },
  { label: "Finance Overview", href: "/dean/finance", icon: BadgeDollarSign },
  { label: "Fee Approvals", href: "/dean/fees", icon: FileCheck },
  { label: "Schedule Approvals", href: "/dean/schedules", icon: CalendarCheck },
  { label: "Operations Monitor", href: "/dean/operations", icon: Radar },
  { label: "Announcements", href: "/dean/announcements", icon: Megaphone },
  { label: "Governance / Holds", href: "/dean/governance", icon: ShieldAlert },
  { label: "Settings", href: "/dean/settings", icon: Settings },
];
