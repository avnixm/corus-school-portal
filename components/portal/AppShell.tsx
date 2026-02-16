"use client";

import * as React from "react";
import { Sidebar, SidebarItem, SidebarConfig } from "./Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { getStudentNavItems } from "./nav/student";
import { getAdminNavItems } from "./nav/admin";
import { getRegistrarNavItems, getRegistrarNavConfig } from "./nav/registrar";
import { getFinanceNavItems } from "./nav/finance";
import { getTeacherNavItems } from "./nav/teacher";
import { getProgramHeadNavItems } from "./nav/programHead";
import { getDeanNavItems } from "./nav/dean";

interface AppShellProps {
  sidebarItems?: SidebarItem[];
  navVariant?: "student" | "registrar" | "admin" | "finance" | "teacher" | "program_head" | "dean";
  title?: string;
  userDisplay?: string;
  userId?: string;
  role?: string;
  signOutAction?: (prevState: any) => Promise<any>;
  children: React.ReactNode;
}

function formatRoleLabel(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, " ");
}

export function AppShell({
  sidebarItems: providedItems,
  navVariant,
  title = "Dashboard",
  userDisplay,
  userId,
  role,
  signOutAction,
  children,
}: AppShellProps) {
  // For registrar, use the new grouped config
  const registrarConfig = navVariant === "registrar" ? getRegistrarNavConfig() : undefined;
  
  const sidebarItems =
    providedItems ??
    (navVariant === "registrar"
      ? undefined // Use config instead
      : navVariant === "finance"
      ? getFinanceNavItems()
      : navVariant === "teacher"
      ? getTeacherNavItems()
      : navVariant === "program_head"
      ? getProgramHeadNavItems()
      : navVariant === "dean"
      ? getDeanNavItems()
      : navVariant === "admin" || role === "admin"
      ? getAdminNavItems()
      : getStudentNavItems());
  
  // Determine portal label based on navVariant or role
  const portalLabel = 
    navVariant === "registrar" ? "Registrar Portal" :
    navVariant === "finance" ? "Finance Portal" :
    navVariant === "teacher" ? "Teacher Portal" :
    navVariant === "program_head" ? "Program Head Portal" :
    navVariant === "dean" ? "Dean Portal" :
    navVariant === "admin" ? "Admin Portal" :
    role === "admin" ? "Admin Portal" :
    "Student Portal";
  
  const showSidebar = (sidebarItems && sidebarItems.length > 0) || registrarConfig;
  const displayText = userDisplay ?? (userId ? userId.slice(0, 8) : null);
  const initials = userId ? userId.slice(0, 2).toUpperCase() : "?";
  const [isPending, setIsPending] = React.useState(false);

  const handleLogout = async () => {
    if (signOutAction) {
      setIsPending(true);
      try {
        await signOutAction({});
      } finally {
        setIsPending(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {showSidebar && (
        <Sidebar 
          items={sidebarItems} 
          config={registrarConfig}
          portalLabel={portalLabel}
        />
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur-md">
          <div className="flex items-center justify-between px-6 py-3">
            <h1 className="text-lg font-semibold tracking-tight text-[#6A0000]">
              {title}
            </h1>
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
                "bg-white/80 text-neutral-800"
              )}
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#6A0000]/10 text-[#6A0000] text-xs font-semibold">
                {initials}
              </span>
              <div className="flex flex-col items-start">
                {displayText && (
                  <span className="whitespace-nowrap text-xs font-medium">
                    {displayText}
                  </span>
                )}
                {role && (
                  <Badge
                    variant="outline"
                    className="mt-0.5 border-[#6A0000]/40 text-[#6A0000] text-xs"
                  >
                    {formatRoleLabel(role)}
                  </Badge>
                )}
              </div>
              {signOutAction && (
                <form action={signOutAction} className="ml-2">
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    disabled={isPending}
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4 text-neutral-700" />
                  </Button>
                </form>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-6 text-neutral-900">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

