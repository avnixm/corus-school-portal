export type SubjectType = "GE" | "PROGRAM";

export interface CreateSubjectInput {
  type: SubjectType;
  programId?: string | null;
  code: string;
  title: string;
  units: number;
  active?: boolean;
}

export interface UpdateSubjectInput {
  code?: string;
  title?: string;
  units?: number;
  active?: boolean;
  type?: SubjectType;
  programId?: string | null;
}

/** GE: is_ge=true, program_id must be null. Program: is_ge=false, program_id required. */
export function validateCreateSubject(input: CreateSubjectInput): { ok: true } | { ok: false; error: string } {
  const code = input.code?.trim();
  const title = input.title?.trim();
  if (!code) return { ok: false, error: "Code is required" };
  if (!title) return { ok: false, error: "Title is required" };
  if (input.units == null || input.units < 0) return { ok: false, error: "Units must be 0 or greater" };

  if (input.type === "GE") {
    if (input.programId) return { ok: false, error: "GE subjects must not have a program" };
    return { ok: true };
  }
  if (input.type === "PROGRAM") {
    if (!input.programId) return { ok: false, error: "Program is required for program subjects" };
    return { ok: true };
  }
  return { ok: false, error: "Invalid subject type" };
}

export function validateUpdateSubject(input: UpdateSubjectInput): { ok: true } | { ok: false; error: string } {
  if (input.code !== undefined && !input.code?.trim()) return { ok: false, error: "Code cannot be empty" };
  if (input.title !== undefined && !input.title?.trim()) return { ok: false, error: "Title cannot be empty" };
  if (input.units != null && input.units < 0) return { ok: false, error: "Units must be 0 or greater" };
  if (input.type === "GE" && input.programId) return { ok: false, error: "GE subjects must not have a program" };
  if (input.type === "PROGRAM" && input.programId === undefined) {
    // allow leaving programId as-is when type not changed
  } else if (input.type === "PROGRAM" && !input.programId) {
    return { ok: false, error: "Program is required for program subjects" };
  }
  return { ok: true };
}

/** Compute scope_code for uniqueness: GE => 'GE:'+code, else program_id+':'+code */
export function computeScopeCode(isGe: boolean, code: string, programId: string | null): string {
  const c = code.trim();
  if (isGe) return `GE:${c}`;
  if (programId) return `${programId}:${c}`;
  return `LEGACY:${c}`;
}
