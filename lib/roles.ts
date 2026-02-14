// path: lib/roles.ts

export type Role =
  | "student"
  | "teacher"
  | "registrar"
  | "finance"
  | "program_head"
  | "dean"
  | "admin";

const HOME_PATHS: Record<Role, string> = {
  student: "/student",
  teacher: "/teacher",
  registrar: "/registrar",
  finance: "/finance",
  program_head: "/program-head",
  dean: "/dean",
  admin: "/admin",
};

export function roleHomePath(role: string): string {
  if (role in HOME_PATHS) {
    return HOME_PATHS[role as Role];
  }
  return "/dashboard";
}

const LABELS: Record<Role, string> = {
  student: "Student",
  teacher: "Teacher",
  registrar: "Registrar",
  finance: "Finance",
  program_head: "Program Head",
  dean: "Dean",
  admin: "Admin",
};

export function roleLabel(role: string): string {
  if (role in LABELS) {
    return LABELS[role as Role];
  }
  return role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, " ");
}

const BADGE_COLORS: Record<Role, string> = {
  student: "border-[#6A0000]/40 text-[#6A0000]",
  teacher: "border-[#6A0000]/40 text-[#6A0000]",
  registrar: "border-[#6A0000]/40 text-[#6A0000]",
  finance: "border-[#6A0000]/40 text-[#6A0000]",
  program_head: "border-[#6A0000]/40 text-[#6A0000]",
  dean: "border-[#6A0000]/40 text-[#6A0000]",
  admin: "border-[#6A0000]/40 text-[#6A0000]",
};

export function roleBadgeColorClass(role: string): string {
  if (role in BADGE_COLORS) {
    return BADGE_COLORS[role as Role];
  }
  return "border-neutral-300 text-neutral-700";
}
