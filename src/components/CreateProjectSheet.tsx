"use client";

import { useState, ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "./ui/button";
import { CreateProjectForm } from "./CreateProjectForm";
import { Plus } from "lucide-react";

export function CreateProjectSheet({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Proyek Baru
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Buat Proyek Baru</SheetTitle>
          <SheetDescription>
            Isi detail di bawah ini untuk membuat proyek baru. Proyek akan muncul di kalender dan daftar proyek Anda.
          </SheetDescription>
        </SheetHeader>
        <CreateProjectForm onFinished={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}