import { Spinner } from "@/components/ui/spinner";

export default function StudentLoading() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-white">
      <Spinner />
    </div>
  );
}
