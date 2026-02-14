import {
  LayoutDashboard,
  FileSpreadsheet,
  Wallet,
  BadgeDollarSign,
  BarChart3,
  Settings,
  ShieldCheck,
} from "lucide-react";
import type { SidebarItem } from "../Sidebar";

export const getFinanceNavItems = (): SidebarItem[] => [
  { label: "Dashboard", href: "/finance", icon: LayoutDashboard },
  { label: "Assessments", href: "/finance/assessments", icon: FileSpreadsheet },
  { label: "Payments", href: "/finance/payments", icon: Wallet },
  { label: "Student Balances", href: "/finance/balances", icon: BadgeDollarSign },
  {
    label: "Collections Report",
    href: "/finance/reports/collections",
    icon: BarChart3,
  },
  { label: "Fee Setup", href: "/finance/fee-setup", icon: Settings },
  { label: "Clearance", href: "/finance/clearance", icon: ShieldCheck },
];
