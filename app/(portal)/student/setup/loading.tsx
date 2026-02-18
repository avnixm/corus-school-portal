import { Spinner } from "@/components/ui/spinner";

export default function StudentSetupLoading() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] min-w-full items-center justify-center bg-white">
      <Spinner className="text-[#6A0000]" />
    </div>
  );
}
