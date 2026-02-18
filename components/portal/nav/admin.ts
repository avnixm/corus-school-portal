import {
  LayoutDashboard,
  Users,
  KeyRound,
  Layers,
  Settings,
  ScrollText,
  Wrench,
  Activity,
  LifeBuoy,
} from "lucide-react";
import type { SidebarItem } from "../Sidebar";

export const getAdminNavItems = (): SidebarItem[] => [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "User Management", href: "/admin/users", icon: Users },
  { label: "Roles & Access", href: "/admin/roles", icon: KeyRound },
  { label: "Program Assignments", href: "/admin/programs", icon: Layers },
  { label: "School Settings", href: "/admin/settings", icon: Settings },
  { label: "Audit Log", href: "/admin/audit", icon: ScrollText },
  { label: "Support Requests", href: "/admin/support", icon: LifeBuoy },
  { label: "Data Tools", href: "/admin/tools", icon: Wrench },
  { label: "System Health", href: "/admin/health", icon: Activity },
];
