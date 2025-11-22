import { Button } from "@/components/ui/button";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";

interface SortableTableHeadProps extends React.ComponentProps<typeof TableHead> {
  title: string;
  columnKey: string;
  sortKey: string | null;
  sortDirection: "asc" | "desc" | null;
  onSort: (key: string) => void;
}

export function SortableTableHead({
  title,
  columnKey,
  sortKey,
  sortDirection,
  onSort,
  className,
  ...props
}: SortableTableHeadProps) {
  return (
    <TableHead {...props} className={cn("p-0", className)}>
      <Button
        variant="ghost"
        type="button"
        onClick={() => onSort(columnKey)}
        className="h-full w-full justify-start px-4 py-3 hover:bg-transparent hover:text-accent-foreground text-left font-medium text-muted-foreground"
      >
        <span className="flex items-center gap-2">
          {title}
          {sortKey === columnKey && (
            <>
              {sortDirection === "asc" && <ArrowUp className="h-3 w-3" />}
              {sortDirection === "desc" && <ArrowDown className="h-3 w-3" />}
            </>
          )}
        </span>
      </Button>
    </TableHead>
  );
}