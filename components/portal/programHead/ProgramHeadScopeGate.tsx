import Link from "next/link";

export function ProgramHeadScopeGate({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
        {title}
      </h2>
      <p className="text-neutral-800">
        Set your program scope in{" "}
        <Link
          href="/program-head/settings"
          className="font-medium text-[#6A0000] underline"
        >
          Settings
        </Link>{" "}
        first.
      </p>
    </div>
  );
}
