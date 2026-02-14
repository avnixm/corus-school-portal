// path: components/portal/nav/index.ts

"use client";

import type { SidebarItem } from "../Sidebar";
import { getStudentNavItems } from "./student";
import { getTeacherNavItems } from "./teacher";
import { getRegistrarNavItems } from "./registrar";
import { getFinanceNavItems } from "./finance";
import { getProgramHeadNavItems } from "./programHead";
import { getDeanNavItems } from "./dean";
import { getAdminNavItems } from "./admin";

export { getStudentNavItems } from "./student";
export { getTeacherNavItems } from "./teacher";
export { getRegistrarNavItems } from "./registrar";
export { getFinanceNavItems } from "./finance";
export { getProgramHeadNavItems } from "./programHead";
export { getDeanNavItems } from "./dean";
export { getAdminNavItems } from "./admin";

export const studentNav = getStudentNavItems();
export const teacherNav = getTeacherNavItems();
export const registrarNav = getRegistrarNavItems();
export const financeNav = getFinanceNavItems();
export const programHeadNav = getProgramHeadNavItems();
export const deanNav = getDeanNavItems();
export const adminNav = getAdminNavItems();

export function getNavForRole(role: string): SidebarItem[] {
  switch (role) {
    case "student":
      return getStudentNavItems();
    case "teacher":
      return getTeacherNavItems();
    case "registrar":
      return getRegistrarNavItems();
    case "finance":
      return getFinanceNavItems();
    case "program_head":
      return getProgramHeadNavItems();
    case "dean":
      return getDeanNavItems();
    case "admin":
      return getAdminNavItems();
    default:
      return getStudentNavItems();
  }
}

const PORTAL_SUBTITLES: Record<string, string> = {
  student: "Student Portal",
  teacher: "Teacher Portal",
  registrar: "Registrar Portal",
  finance: "Finance Portal",
  program_head: "Program Head Portal",
  dean: "Dean Portal",
  admin: "Admin",
};

export function getPortalSubtitleForRole(role: string): string {
  return PORTAL_SUBTITLES[role] ?? "Portal";
}
