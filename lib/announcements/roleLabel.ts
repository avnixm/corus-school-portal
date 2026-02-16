/**
 * Display label for announcement sender role.
 */
export function getRoleDisplayLabel(role: string | null | undefined): string {
  if (!role) return "—";
  switch (role) {
    case "registrar":
      return "REGISTRAR";
    case "dean":
      return "OFFICE OF THE DEAN";
    case "finance":
      return "FINANCE";
    case "program_head":
      return "PROGRAM HEAD";
    case "teacher":
      return "TEACHING";
    case "admin":
      return "ADMINISTRATION";
    case "student":
      return "STUDENT";
    default:
      return role.toUpperCase().replace(/_/g, " ");
  }
}
