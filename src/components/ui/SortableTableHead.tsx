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
        onClick={(e) => {
          e.preventDefault();
          onSort(columnKey);
        }}
        className="h-full w-full justify-start rounded-none px-4 py-2 hover:bg-muted/50 font-medium text-muted-foreground group"
      >
        <span className="truncate">{children}</span>
        {isSorted && sortDirection === "asc" && (
          <ArrowUp className="ml-2 h-4 w-4 shrink-0 text-foreground" />
        )}
        {isSorted && sortDirection === "desc" && (
          <ArrowDown className="ml-2 h-4 w-4 shrink-0 text-foreground" />
        )}
        {(!isSorted || !sortDirection) && (
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />
        )}
      </Button>
    </TableHead>
  );
}