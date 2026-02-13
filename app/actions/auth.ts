"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

export interface AuthState {
  error?: string;
  success?: boolean;
}

export async function signOutAction(
  _prevState: AuthState
): Promise<AuthState> {
  await auth.signOut();
  redirect("/login");
}
