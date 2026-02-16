"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronRight } from "lucide-react";

export type SidebarItem = {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

export type SidebarGroup = {
  key: string;
  title: string;
  items: SidebarItem[];
  defaultOpen?: boolean;
};

export type SidebarConfig = {
  quickAccess: SidebarItem[];
  groups: SidebarGroup[];
};

interface SidebarProps {
  items?: SidebarItem[];
  config?: SidebarConfig;
  portalLabel?: string;
}

const STORAGE_KEY = "registrar_sidebar_groups";

function NavItem({ item, isActive }: { item: SidebarItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        "text-neutral-800 hover:bg-[#6A0000]/5 hover:text-[#6A0000]",
        isActive &&
          "bg-[#6A0000]/10 text-[#6A0000] border border-[#6A0000]/30"
      )}
    >
      <item.icon className="h-4 w-4" />
      <span>{item.label}</span>
    </Link>
  );
}

function SidebarGroupComponent({ group, pathname }: { group: SidebarGroup; pathname: string }) {
  // Check if any item in this group is active
  const hasActiveItem = group.items.some((item) => {
    const isBasePath = ["/student", "/registrar", "/admin", "/finance", "/teacher", "/program-head", "/dean"].includes(
      item.href
    );
    return isBasePath
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(item.href + "/");
  });

  // Load saved state from localStorage, with initial auto-expand for active items
  const [isOpen, setIsOpen] = React.useState(() => {
    if (typeof window === "undefined") return group.defaultOpen ?? false;
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const states = JSON.parse(saved);
        // If saved state exists for this group, use it (user has interacted)
        if (group.key in states) {
          return states[group.key];
        }
      }
    } catch (e) {
      // Fallback to default
    }
    
    // First load: auto-expand if contains active item, otherwise use defaultOpen
    return hasActiveItem || group.defaultOpen || false;
  });

  // Save state to localStorage whenever it changes
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const states = saved ? JSON.parse(saved) : {};
      states[group.key] = isOpen;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
    } catch (e) {
      // Ignore storage errors
    }
  }, [isOpen, group.key]);

  return (
    <Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
      <Collapsible.Trigger 
        className={cn(
          "flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
          hasActiveItem ? "text-[#6A0000]" : "text-neutral-500 hover:text-[#6A0000]"
        )}
      >
        <span>{group.title}</span>
        <ChevronRight
          className={cn(
            "h-4 w-4 transition-transform duration-300 ease-in-out",
            isOpen && "rotate-90"
          )}
        />
      </Collapsible.Trigger>
      <Collapsible.Content 
        className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up"
      >
        <div className="space-y-1 pt-1 pb-2">
          {group.items.map((item) => {
            const isBasePath = ["/student", "/registrar", "/admin", "/finance", "/teacher", "/program-head", "/dean"].includes(
              item.href
            );
            const isActive = isBasePath
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");

            return <NavItem key={item.href} item={item} isActive={isActive} />;
          })}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

export function Sidebar({ items, config, portalLabel = "Student Portal" }: SidebarProps) {
  const pathname = usePathname();

  // Legacy support: if items provided, use old behavior
  if (items && !config) {
    return (
      <aside className="flex h-screen w-72 flex-col border-r bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6A0000] text-white font-semibold">
            C
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-[#6A0000]">
              CORUS
            </span>
            <span className="text-xs text-neutral-700">
              {portalLabel}
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => {
            const isBasePath = ["/student", "/registrar", "/admin", "/finance", "/teacher", "/program-head", "/dean"].includes(
              item.href
            );
            const isActive = isBasePath
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");

            return <NavItem key={item.href} item={item} isActive={isActive} />;
          })}
        </nav>
      </aside>
    );
  }

  // New grouped sidebar
  return (
    <aside className="flex h-screen w-72 flex-col border-r bg-white/80 backdrop-blur-sm">
      <div className="flex items-center gap-3 px-6 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6A0000] text-white font-semibold">
          C
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight text-[#6A0000]">
            CORUS
          </span>
          <span className="text-xs text-neutral-700">
            {portalLabel}
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-3 px-3 py-4 overflow-y-auto">
        {/* Quick Access Section */}
        {config?.quickAccess && config.quickAccess.length > 0 && (
          <div className="space-y-1">
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Quick Access
            </div>
            {config.quickAccess.map((item) => {
              const isBasePath = ["/student", "/registrar", "/admin", "/finance", "/teacher", "/program-head", "/dean"].includes(
                item.href
              );
              const isActive = isBasePath
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + "/");

              return <NavItem key={item.href} item={item} isActive={isActive} />;
            })}
          </div>
        )}

        {/* Collapsible Groups */}
        {config?.groups && config.groups.map((group) => (
          <SidebarGroupComponent key={group.key} group={group} pathname={pathname} />
        ))}
      </nav>
    </aside>
  );
}

