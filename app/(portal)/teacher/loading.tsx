import { Spinner } from "@/components/ui/spinner";

export default function TeacherLoading() {
  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-1 items-center justify-center bg-white">
      <Spinner className="text-[#6A0000]" />
    </div>
  );
}
