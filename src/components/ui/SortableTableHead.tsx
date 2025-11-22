import { TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableTableHeadProps<T> extends React.HTMLAttributes<HTMLTableCellElement> {
  columnKey: keyof T;
  onSort: (key: keyof T) => void;
  sortConfig: { key: keyof T | null; direction: 'asc' | 'desc' };
}

export const SortableTableHead = <T,>({ children, columnKey, onSort, sortConfig, className, ...props }: SortableTableHeadProps<T>) => {
  const isActive = sortConfig.key === columnKey;
  const isAscending = sortConfig.direction === 'asc';
  const Icon = isActive ? (isAscending ? ArrowUp : ArrowDown) : ChevronsUpDown;

  return (
    <TableHead {...props} className={cn("p-2", className)}>
      <Button variant="ghost" onClick={() => onSort(columnKey)} className="w-full justify-start px-2 group h-auto py-1">
        {children}
        <Icon className={cn("ml-2 h-4 w-4", !isActive && "text-muted-foreground/50 group-hover:text-muted-foreground")} />
      </Button>
    </TableHead>
  );
};