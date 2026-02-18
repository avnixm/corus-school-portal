import { Spinner } from "@/components/ui/spinner";

export default function StudentSetupLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-white">
      <Spinner className="text-[#6A0000]" />
    </div>
  );
}
