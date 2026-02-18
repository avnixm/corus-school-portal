"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { formatStatusForDisplay } from "@/lib/formatStatus";
import { SubmitToDeanButton } from "./SubmitToDeanButton";

type Config = {
  id: string;
  programCode: string | null;
  title: string;
  startHour: number;
  endHour: number;
  timeIncrement: number;
  status: string;
};

function formatTime(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:00 ${period}`;
}

export function TimeConfigRowActions({ config }: { config: Config }) {
  const [viewOpen, setViewOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setViewOpen(true)}
          className="h-8 gap-1"
        >
          <Eye className="h-3 w-3" />
          View
        </Button>
        {config.status === "draft" && <SubmitToDeanButton configId={config.id} />}
      </div>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Time Configuration Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <span className="font-medium text-neutral-500">Program</span>
              <p className="mt-0.5 font-medium">{config.programCode ?? "—"}</p>
            </div>
            <div>
              <span className="font-medium text-neutral-500">Title</span>
              <p className="mt-0.5">{config.title}</p>
            </div>
            <div>
              <span className="font-medium text-neutral-500">Time Range</span>
              <p className="mt-0.5">
                {formatTime(config.startHour)} – {formatTime(config.endHour)}
              </p>
            </div>
            <div>
              <span className="font-medium text-neutral-500">Increment</span>
              <p className="mt-0.5">{config.timeIncrement} mins</p>
            </div>
            <div>
              <span className="font-medium text-neutral-500">Status</span>
              <p className="mt-0.5">
                <Badge
                  variant="outline"
                  className={
                    config.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : config.status === "submitted"
                        ? "bg-blue-100 text-blue-800"
                        : config.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : ""
                  }
                >
                  {formatStatusForDisplay(config.status)}
                </Badge>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
