import { TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableTableHeadProps extends React.ComponentProps<typeof TableHead> {
  children: React.ReactNode;
  onSort: (key: string) => void;
  sortKey?: string;
  sortOrder?: "asc" | "desc";
  columnKey: string;
}

export const SortableTableHead = ({
  children,
  onSort,
  sortKey,
  sortOrder,
  columnKey,
  className,
  ...props
}: SortableTableHeadProps) => {
  const isActive = sortKey === columnKey;
  const Icon = isActive
    ? sortOrder === "asc"
      ? ArrowUp
      : ArrowDown
    : ChevronsUpDown;

  return (
    <TableHead {...props} className={cn("p-0", className)}>
      <Button
        variant="ghost"
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onSort(columnKey);
        }}
        className="w-full justify-start px-4 py-3 h-auto hover:bg-muted/50 rounded-none text-left font-medium group"
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