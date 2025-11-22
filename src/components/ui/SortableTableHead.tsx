"use client";

import { Button } from "@/components/ui/button";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

interface SortableTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  onSort: (key: string) => void;
  sortKey?: string | null;
  sortDirection?: 'asc' | 'desc' | null;
  columnKey: string;
}

export function SortableTableHead({
  children,
  onSort,
  sortKey,
  sortDirection,
  columnKey,
  className,
  ...props
}: SortableTableHeadProps) {
  const isSorted = sortKey === columnKey;

  return (
    <TableHead {...props} className={cn("p-0", className)}>
      <Button
        variant="ghost"
        type="button"
        onClick={() => onSort(columnKey)}
        className="h-full w-full justify-start rounded-none px-4 py-2 font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      >
        <span className="truncate mr-2">{children}</span>
        {isSorted ? (
          sortDirection === "asc" ? (
            <ArrowUp className="h-4 w-4 shrink-0 text-foreground" />
          ) : (
            <ArrowDown className="h-4 w-4 shrink-0 text-foreground" />
          )
        ) : (
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        )}
      </Button>
    </TableHead>
  );
}