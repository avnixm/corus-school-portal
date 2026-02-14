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
} from "lucide-react";
import type { SidebarItem } from "../Sidebar";

export const getProgramHeadNavItems = (): SidebarItem[] => [
  { label: "Dashboard", href: "/program-head", icon: LayoutDashboard },
  { label: "Enrollment Analytics", href: "/program-head/enrollments", icon: UsersRound },
  { label: "Grade Analytics", href: "/program-head/grades", icon: BarChart3 },
  { label: "Grade Submissions", href: "/program-head/submissions", icon: ClipboardCheck },
  { label: "Finance Clearance", href: "/program-head/clearance", icon: ShieldCheck },
  { label: "Fee Approvals", href: "/program-head/fees", icon: BadgeDollarSign },
  { label: "Sections & Loads", href: "/program-head/sections", icon: Layers },
  { label: "Announcements", href: "/program-head/announcements", icon: Megaphone },
  { label: "Settings", href: "/program-head/settings", icon: Settings },
];
