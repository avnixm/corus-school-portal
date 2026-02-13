"use client";

import Link from "next/link";
import HeaderAuth from "./header-auth";


export default function Header({ showActions = true }: { showActions?: boolean }) {
  return (
    <header className="relative z-10 w-full border-b bg-white/70 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold text-corus-maroon">CORUS</Link>
        {showActions ? (
          <nav className="flex items-center gap-3">
            <HeaderAuth />
          </nav>
        ) : (
          <div />
        )}
      </div>
    </header>
  );
}

