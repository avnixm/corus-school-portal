"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";

export default function SpinnerDemoPage() {
  const [showFullscreen, setShowFullscreen] = useState(false);

  useEffect(() => {
    if (!showFullscreen) return;
    const id = setTimeout(() => setShowFullscreen(false), 3000);
    return () => clearTimeout(id);
  }, [showFullscreen]);

  return (
    <div className="space-y-8 p-6">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Spinner Demo
        </h2>
        <p className="mt-1 text-sm text-neutral-700">
          Inline and fullscreen variants with accessibility support.
        </p>
      </section>

      <section>
        <h3 className="text-sm font-medium text-neutral-800">Inline spinner</h3>
        <p className="mt-2 text-sm text-neutral-600">
          For buttons, sections, or inline loading states.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <Spinner size={24} />
          <Spinner size={32} strokeWidth={1.5} className="text-[--color-corus-maroon]" />
          <Spinner size={20} label="Fetching data…" />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium text-neutral-800">Fullscreen centered</h3>
        <p className="mt-2 text-sm text-neutral-600">
          Overlay with optional delay to avoid flicker on fast loads.
        </p>
        <button
          type="button"
          onClick={() => setShowFullscreen(true)}
          className="mt-4 rounded-md bg-[--color-corus-maroon] px-4 py-2 text-sm font-medium text-white hover:bg-[--color-corus-maroon-dark]"
        >
          Show fullscreen loader (3s)
        </button>
      </section>

      {showFullscreen && <Spinner center delayMs={300} label="Loading…" />}
    </div>
  );
}
