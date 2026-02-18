import { Spinner } from "@/components/ui/spinner";

export default function PortalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <Spinner className="text-[#6A0000]" />
    </div>
  );
}
