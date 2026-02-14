// path: app/not-authorized/page.tsx

import Link from "next/link";

export default function NotAuthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-50 px-4">
      <h1 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
        Not Authorized
      </h1>
      <p className="max-w-sm text-center text-sm text-neutral-600">
        You don&apos;t have access to this area. Go to your dashboard to continue.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex h-9 items-center justify-center rounded-md bg-[--color-corus-maroon] px-4 py-2 text-sm font-medium text-white hover:bg-[--color-corus-maroon-dark]"
      >
        Go to my dashboard
      </Link>
    </div>
  );
}
