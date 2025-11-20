import { TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortConfig {
  key: any;
  direction: "asc" | "desc";
}

interface SortableTableHeadProps extends React.ComponentProps<typeof TableHead> {
  children: React.ReactNode;
  onSort: (key: string) => void;
  columnKey: string;
  sortConfig?: SortConfig;
  sortKey?: string;
  sortOrder?: "asc" | "desc";
}

export const SortableTableHead = ({
  children,
  onSort,
  sortKey,
  sortOrder,
  sortConfig,
  columnKey,
  className,
  ...props
}: SortableTableHeadProps) => {
  const currentKey = sortConfig ? sortConfig.key : sortKey;
  const currentDirection = sortConfig ? sortConfig.direction : sortOrder;

  const isActive = currentKey === columnKey;
  const Icon = isActive
    ? currentDirection === "asc"
      ? ArrowUp
      : ArrowDown
    : ChevronsUpDown;

  return (
    <TableHead {...props} className={cn("p-0", className)}>
      <Button
        variant="ghost"
        type="button"
        onClick={() => onSort(columnKey)}
        className="w-full justify-start px-4 py-3 h-auto hover:bg-muted/50 rounded-none text-left font-medium group select-none active:bg-muted"
      >
        <span className="truncate">{children}</span>
        <Icon 
          className={cn(
            "ml-2 h-4 w-4 flex-shrink-0 transition-opacity", 
            !isActive && "text-muted-foreground/40 opacity-50 group-hover:opacity-100"
          )} 
        />
      </Button>
    </TableHead>
  );
};

export default SortableTableHead;