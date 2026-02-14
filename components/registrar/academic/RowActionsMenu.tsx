"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function RowActionsMenu<T extends { id: string }>({
  item,
  itemLabel,
  onEdit,
  onDelete,
  requireDeleteConfirm = true,
}: {
  item: T;
  itemLabel: string;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void | Promise<void>;
  requireDeleteConfirm?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [open]);

  async function handleDeleteClick() {
    if (requireDeleteConfirm) {
      setDeleteConfirmOpen(true);
      setOpen(false);
    } else {
      await onDelete(item);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    await onDelete(item);
    setDeleting(false);
    setDeleteConfirmOpen(false);
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          aria-expanded={open}
          aria-haspopup="true"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
        {open && (
          <div
            className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-md border border-neutral-200 bg-white py-1 shadow-md"
            role="menu"
          >
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
              onClick={() => {
                onEdit(item);
                setOpen(false);
              }}
              role="menuitem"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              onClick={handleDeleteClick}
              role="menuitem"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {itemLabel}?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to delete this item?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
