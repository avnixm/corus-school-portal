import Link from "next/link";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  showActions?: boolean;
}

export default function Header({ showActions = true }: HeaderProps) {
  return (
    <header className="relative z-10 border-b border-neutral-200/50 bg-white/60 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-corus-maroon text-white font-semibold">
            C
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight">
              CORUS
            </span>
            <span className="text-xs text-neutral-500">
              Student Portal
            </span>
          </div>
        </div>
        {showActions && (
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">
                Register
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
