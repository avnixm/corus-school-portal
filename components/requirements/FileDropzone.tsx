"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Upload, Loader2 } from "lucide-react";

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  onError?: (message: string) => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  isUploading?: boolean;
  className?: string;
}

export function FileDropzone({
  onFileSelect,
  onError,
  accept = "application/pdf,image/jpeg,image/png,image/jpg",
  maxSize = 10 * 1024 * 1024,
  disabled,
  isUploading,
  className,
}: FileDropzoneProps) {
  const [drag, setDrag] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const validate = (file: File): string | null => {
    if (file.size > maxSize) return "File too large (max 10MB)";
    return null;
  };

  const handleFile = (file: File | null) => {
    if (!file) return;
    const err = validate(file);
    if (err) {
      if (onError) {
        onError(err);
      }
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    if (disabled || isUploading) return;
    const file = e.dataTransfer.files?.[0];
    handleFile(file ?? null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFile(file ?? null);
    e.target.value = "";
  };

  return (
    <div
      className={cn(
        "rounded-lg border-2 border-dashed p-6 text-center transition-colors",
        drag && !disabled && "border-[#6A0000]/50 bg-[#6A0000]/5",
        !drag && "border-neutral-200 bg-neutral-50/50",
        (disabled || isUploading) && "pointer-events-none opacity-60",
        className
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
        disabled={disabled || isUploading}
      />
      {isUploading ? (
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#6A0000]" />
      ) : (
        <Upload className="mx-auto h-8 w-8 text-neutral-500" />
      )}
      <p className="mt-2 text-sm text-neutral-600">
        Drag and drop or click to upload
      </p>
      <p className="mt-1 text-xs text-neutral-500">PDF, JPG, PNG (max 10MB)</p>
    </div>
  );
}
