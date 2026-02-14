"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type SidebarItem = {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

interface SidebarProps {
  items: SidebarItem[];
}

export function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname();

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
            Student Portal
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const isBasePath = ["/student", "/registrar", "/admin", "/finance"].includes(
            item.href
          );
          const isActive = isBasePath
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
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
        })}
      </nav>
    </aside>
  );
}

