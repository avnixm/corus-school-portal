import {
  LayoutDashboard,
  NotebookText,
  Calendar,
  Megaphone,
  CreditCard,
  User,
  FileCheck,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";

import type { SidebarItem } from "../Sidebar";

export const getStudentNavItems = (): SidebarItem[] => [
  {
    label: "Dashboard",
    href: "/student",
    icon: LayoutDashboard,
  },
  {
    label: "Forms & requirements",
    href: "/student/requirements",
    icon: FileCheck,
  },
  {
    label: "Enrollment",
    href: "/student/enrollment",
    icon: ClipboardList,
  },
  {
    label: "Clearance",
    href: "/student/clearance",
    icon: ShieldCheck,
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

