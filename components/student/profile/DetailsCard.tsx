import { Card, CardContent, CardHeader } from "@/components/ui/card";

type DetailItem = {
  label: string;
  value: string | null | undefined;
};

type DetailsCardProps = {
  title: string;
  items: DetailItem[];
};

function val(v: string | null | undefined): string {
  return v != null && String(v).trim() !== "" ? String(v) : "—";
}

export function DetailsCard({ title, items }: DetailsCardProps) {
  return (
    <Card className="rounded-2xl border border-neutral-200 shadow-sm">
      <CardHeader className="pb-2">
        <h3 className="text-base font-semibold text-[#6A0000]">{title}</h3>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <dl className="space-y-2">
          {items.map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
              <dt className="min-w-[120px] text-sm text-neutral-600">{label}</dt>
              <dd className="text-sm text-neutral-900">{val(value)}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
