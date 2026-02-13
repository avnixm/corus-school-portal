import { Users } from "lucide-react";
import type { SidebarItem } from "../Sidebar";

export const getAdminNavItems = (): SidebarItem[] => [
  { label: "Users", href: "/admin/users", icon: Users },
];
