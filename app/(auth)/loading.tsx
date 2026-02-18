import { Spinner } from "@/components/ui/spinner";

export default function AuthLoading() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-white">
      <Spinner className="text-[#6A0000]" />
    </div>
  );
}
