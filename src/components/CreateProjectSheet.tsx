"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CreateProjectForm } from "./CreateProjectForm";

interface CreateProjectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectSheet({ open, onOpenChange }: CreateProjectSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Buat Proyek Baru</SheetTitle>
          <SheetDescription>
            Isi detail di bawah ini untuk membuat proyek baru. Proyek akan muncul di kalender dan daftar proyek Anda.
          </SheetDescription>
        </SheetHeader>
        <CreateProjectForm onFinished={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}