import { Button } from "@/components/ui/button";
import { TableHead } from "@/components/ui/table";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableTableHeadProps {
  columnKey: string;
  onSort: (key: string) => void;
  sortConfig: { key: string | null; direction: 'ascending' | 'descending' };
  children: React.ReactNode;
  className?: string;
}

export const SortableTableHead = ({ columnKey, onSort, sortConfig, children, className }: SortableTableHeadProps) => {
  const isActive = sortConfig.key === columnKey;
  const Icon = isActive ? (sortConfig.direction === 'ascending' ? ArrowUp : ArrowDown) : ChevronsUpDown;

  return (
    <TableHead className={cn("p-2", className)}>
      <Button variant="ghost" onClick={() => onSort(columnKey)} className="w-full justify-start px-2 group h-auto py-1">
        <span className="mr-2">{children}</span>
        <Icon className={cn("h-4 w-4", !isActive && "text-muted-foreground/50")} />
      </Button>
    </TableHead>
  );
};