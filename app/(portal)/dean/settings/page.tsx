export const dynamic = "force-dynamic";

export const metadata = { title: "Settings" };

export default function DeanSettingsPage() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Settings
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          Dean portal has institution-wide access. No scope to configure.
        </p>
      </section>
    </div>
  );
}
