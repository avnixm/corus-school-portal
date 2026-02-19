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
  FileSignature,
} from "lucide-react";
import type { SidebarItem } from "../Sidebar";

export const getDeanNavItems = (): SidebarItem[] => [
  { label: "Dashboard", href: "/dean", icon: LayoutDashboard },
  { label: "Approvals", href: "/dean/approvals", icon: FileCheck },
  { label: "Promissory notes", href: "/dean/promissory-notes", icon: FileSignature },
  { label: "Enrollments", href: "/dean/enrollments", icon: UsersRound },
  { label: "Academics", href: "/dean/academics", icon: GraduationCap },
  { label: "Finance", href: "/dean/finance", icon: BadgeDollarSign },
  { label: "Operations", href: "/dean/operations", icon: Radar },
  { label: "Announcements", href: "/dean/announcements", icon: Megaphone },
  { label: "Governance", href: "/dean/governance", icon: ShieldAlert },
  { label: "Settings", href: "/dean/settings", icon: Settings },
];
