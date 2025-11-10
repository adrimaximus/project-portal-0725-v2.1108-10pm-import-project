import { TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableTableHeadProps<T> {
  children: React.ReactNode;
  columnKey: keyof T;
  sortConfig: { key: keyof T | null; direction: 'asc' | 'desc' };
  onSort: (key: keyof T) => void;
  className?: string;
}

export function SortableTableHead<T>({ children, columnKey, sortConfig, onSort, className }: SortableTableHeadProps<T>) {
  const isActive = sortConfig.key === columnKey;
  const Icon = isActive ? (sortConfig.direction === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown;

  return (
    <TableHead className={cn("p-2", className)}>
      <Button variant="ghost" onClick={() => onSort(columnKey)} className="px-2 py-1 h-auto -mx-2">
        <span className="mr-2">{children}</span>
        <Icon className={cn("h-4 w-4", !isActive && "text-muted-foreground/50")} />
      </Button>
    </TableHead>
  );
}