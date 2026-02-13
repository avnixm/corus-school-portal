"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HeaderAuth() {
  return (
    <div className="flex items-center gap-2">
      <Link href="/login">
        <Button
          variant="ghost"
          className="h-8 px-3 text-xs font-medium md:h-9 md:px-4 md:text-sm"
        >
          Login
        </Button>
      </Link>
      <Link href="/register">
        <Button className="h-8 px-3 text-xs font-medium md:h-9 md:px-4 md:text-sm">
          Get Started
        </Button>
      </Link>
    </div>
  );
}