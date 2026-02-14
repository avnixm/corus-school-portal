import {
  LayoutDashboard,
  NotebookText,
  Calendar,
  Megaphone,
  CreditCard,
  User,
  FileCheck,
  ClipboardList,
} from "lucide-react";

import type { SidebarItem } from "../Sidebar";

export const getStudentNavItems = (): SidebarItem[] => [
  {
    label: "Dashboard",
    href: "/student",
    icon: LayoutDashboard,
  },
  {
    label: "Requirements",
    href: "/student/requirements",
    icon: FileCheck,
  },
  {
    label: "Enrollment",
    href: "/student/enrollment",
    icon: ClipboardList,
  },
  {
    label: "Grades",
    href: "/student/grades",
    icon: NotebookText,
  },
  {
    label: "Schedule",
    href: "/student/schedule",
    icon: Calendar,
  },
  {
    label: "Announcements",
    href: "/student/announcements",
    icon: Megaphone,
  },
  {
    label: "Billing",
    href: "/student/billing",
    icon: CreditCard,
  },
  {
    label: "Profile",
    href: "/student/profile",
    icon: User,
  },
];

