"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarNavContent, SidebarItem, SidebarConfig } from "./Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { LogOut, Menu } from "lucide-react";
import { getStudentNavItems } from "./nav/student";
import { getAdminNavItems } from "./nav/admin";
import { getRegistrarNavItems, getRegistrarNavConfig } from "./nav/registrar";
import { getFinanceNavItems } from "./nav/finance";
import { getTeacherNavItems } from "./nav/teacher";
import { getProgramHeadNavConfig } from "./nav/programHead";
import { getDeanNavItems } from "./nav/dean";

interface AppShellProps {
  sidebarItems?: SidebarItem[];
  navVariant?: "student" | "registrar" | "admin" | "finance" | "teacher" | "program_head" | "dean";
  title?: string;
  userDisplay?: string;
  userId?: string;
  role?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signOutAction?: (prevState: any) => Promise<any>;
  children: React.ReactNode;
}

function formatRoleLabel(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, " ");
}

function LogoutButton({ className }: { className?: string }) {
  const { pending } = useFormStatus();
  return (
    <LoadingButton
      type="submit"
      variant="ghost"
      size="sm"
      pending={pending}
      className={cn("w-full justify-start gap-2 text-neutral-700", className)}
      title="Sign out"
    >
      <LogOut className="h-4 w-4 shrink-0" />
      Sign out
    </LoadingButton>
  );
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
  // For registrar and program_head, use the grouped config
  const registrarConfig = navVariant === "registrar" ? getRegistrarNavConfig() : undefined;
  const programHeadConfig = navVariant === "program_head" ? getProgramHeadNavConfig() : undefined;
  const sidebarConfig = registrarConfig ?? programHeadConfig;

  const sidebarItems =
    providedItems ??
    (navVariant === "registrar"
      ? undefined // Use config instead
      : navVariant === "finance"
      ? getFinanceNavItems()
      : navVariant === "teacher"
      ? getTeacherNavItems()
      : navVariant === "program_head"
      ? undefined // Use config instead
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
  
  const showSidebar = (sidebarItems && sidebarItems.length > 0) || sidebarConfig;
  const displayText = userDisplay ?? (userId ? userId.slice(0, 8) : null);
  const initials = userId ? userId.slice(0, 2).toUpperCase() : "?";
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-neutral-50 overflow-x-hidden">
      {showSidebar && (
        <>
          <div className="print:hidden">
            <Sidebar
              items={sidebarItems}
              config={sidebarConfig}
              portalLabel={portalLabel}
            />
          </div>
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetContent
              side="left"
              className="flex w-72 max-w-[85vw] flex-col p-0"
              showClose={true}
            >
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <div className="flex h-full flex-col overflow-hidden">
                <SidebarNavContent
                  items={sidebarItems}
                  config={sidebarConfig}
                  portalLabel={portalLabel}
                />
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur-md print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2">
              {showSidebar && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-9 w-9 min-h-[44px] min-w-[44px] p-0"
                  onClick={() => setMobileNavOpen(true)}
                  title="Open menu"
                >
                  <Menu className="h-5 w-5 text-neutral-700" />
                </Button>
              )}
              <h1 className="text-lg font-semibold tracking-tight text-[#6A0000]">
                {title}
              </h1>
            </div>
            {signOutAction ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      "bg-[#6A0000]/10 text-[#6A0000] text-sm font-semibold",
                      "ring-neutral-200 transition hover:ring-2 focus:outline-none focus:ring-2 focus:ring-[#6A0000]/30"
                    )}
                    aria-label="Open profile menu"
                  >
                    {initials}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" sideOffset={8} className="w-56 p-2">
                  <div className="space-y-2">
                    {displayText && (
                      <p className="truncate px-2 py-1.5 text-sm font-medium text-neutral-900">
                        {displayText}
                      </p>
                    )}
                    {role && (
                      <div className="px-2">
                        <Badge
                          variant="outline"
                          className="rounded-md border-[#6A0000]/40 text-[#6A0000] text-xs"
                        >
                          {formatRoleLabel(role)}
                        </Badge>
                      </div>
                    )}
                    <form action={signOutAction}>
                      <LogoutButton />
                    </form>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <span
                className={cn(
                  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  "bg-[#6A0000]/10 text-[#6A0000] text-sm font-semibold"
                )}
                aria-hidden
              >
                {initials}
              </span>
            )}
          </div>
        </header>

        <main className="flex-1 bg-white px-4 py-4 text-neutral-900 sm:px-6 sm:py-6 lg:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

