import {
  LayoutDashboard,
  UsersRound,
  BarChart3,
  Layers,
  Megaphone,
  Settings,
  BookOpen,
  CalendarCheck,
  Zap,
} from "lucide-react";
import type { SidebarItem } from "../Sidebar";

// Flat list ordered by process: dashboard → capabilities/sections/scheduling → sectioning → analytics → grades → announcements → settings last
export const getProgramHeadNavItems = (): SidebarItem[] => [
  { label: "Dashboard", href: "/program-head", icon: LayoutDashboard },
  { label: "Teacher Capabilities", href: "/program-head/teacher-capabilities", icon: BookOpen },
  { label: "Sections", href: "/program-head/sections", icon: Layers },
  { label: "Scheduling", href: "/program-head/scheduling", icon: CalendarCheck },
  { label: "Smart Sectioning", href: "/program-head/sectioning", icon: Zap },
  { label: "Enrollment Analytics", href: "/program-head/enrollments", icon: UsersRound },
  { label: "Grades", href: "/program-head/grades", icon: BarChart3 },
  { label: "Announcements", href: "/program-head/announcements", icon: Megaphone },
  { label: "Settings", href: "/program-head/settings", icon: Settings },
];
