import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { Button } from "./button";
import { TableHead } from "./table";
import { cn } from "@/lib/utils";

type SortDirection = 'asc' | 'desc' | 'ascending' | 'descending';

interface SortableTableHeadProps extends React.HTMLAttributes<HTMLTableCellElement> {
  columnKey: string;
  onSort: (key: string) => void;
  sortConfig: { key: string | null; direction: SortDirection };
}

export const SortableTableHead = ({ children, columnKey, onSort, sortConfig, className, ...props }: SortableTableHeadProps) => {
  const isActive = sortConfig.key === columnKey;
  const Icon = isActive ? (sortConfig.direction.startsWith('asc') ? ArrowUp : ArrowDown) : ChevronsUpDown;

  return (
    <TableHead className={className} {...props}>
      <Button variant="ghost" onClick={() => onSort(columnKey)} className="px-2 py-1 h-auto -mx-2">
        <span className="mr-2">{children}</span>
        <Icon className={cn("h-4 w-4", !isActive && "text-muted-foreground/50")} />
      </Button>
    </TableHead>
  );
};