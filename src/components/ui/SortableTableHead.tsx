import React from "react";
import { TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortConfig<T> {
  key: T | null;
  direction: 'asc' | 'desc';
}

interface SortableTableHeadProps<T> extends React.ThHTMLAttributes<HTMLTableCellElement> {
  columnKey: T;
  sortConfig: SortConfig<T>;
  onSort: (key: T) => void;
  children: React.ReactNode;
  className?: string;
}

export function SortableTableHead<T extends string | number | symbol>({
  columnKey,
  sortConfig,
  onSort,
  children,
  className,
  ...props
}: SortableTableHeadProps<T>) {
  const isActive = sortConfig.key === columnKey;
  
  // Ensure direction check is case-insensitive or strict 'asc'
  const isAsc = sortConfig.direction === 'asc';

  return (
    <TableHead {...props} className={cn("p-0", className)}>
      <Button
        variant="ghost"
        type="button"
        onClick={() => onSort(columnKey)}
        className={cn(
          "h-full w-full justify-start px-4 py-2 font-semibold hover:bg-muted/50 rounded-none text-left",
          isActive ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {children}
        <span className="ml-2 flex h-4 w-4 items-center justify-center">
            {isActive ? (
                isAsc ? (
                    <ArrowUp className="h-3 w-3" />
                ) : (
                    <ArrowDown className="h-3 w-3" />
                )
            ) : (
                <ChevronsUpDown className="h-3 w-3 opacity-50" />
            )}
        </span>
      </Button>
    </TableHead>
  );
}