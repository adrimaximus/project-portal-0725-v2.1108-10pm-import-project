import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Task } from "@/types";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';

const columns: ColumnDef<Task>[] = [
  {
    accessorKey: "title",
    header: "Task",
    cell: ({ row }) => (
      <Link to={`/projects/${row.original.project_slug}?tab=tasks&task=${row.original.id}`} className="hover:underline">
        {row.getValue("title")}
      </Link>
    ),
  },
  {
    accessorKey: "project_name",
    header: "Project",
    cell: ({ row }) => (
      <Link to={`/projects/${row.original.project_slug}`} className="hover:underline">
        {row.getValue("project_name")}
      </Link>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge variant="outline">{row.getValue("status")}</Badge>,
  },
  {
    accessorKey: "due_date",
    header: "Due Date",
    cell: ({ row }) => {
      const date = row.getValue("due_date");
      return date ? format(parseISO(date as string), "MMM d, yyyy") : "No due date";
    },
  },
  {
    accessorKey: "priority",
    header: "Priority",
  },
];

interface TasksViewProps {
  tasks: Task[];
  isLoading: boolean;
  error: Error | null;
  hideDoneTasks: boolean;
  setHideDoneTasks: (value: boolean) => void;
  sorting: SortingState;
  onSortingChange: (updater: (old: SortingState) => SortingState) => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

const TasksView = ({
  tasks,
  isLoading,
  error,
  hideDoneTasks,
  setHideDoneTasks,
  sorting,
  onSortingChange,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: TasksViewProps) => {
  const table = useReactTable({
    data: tasks,
    columns,
    state: {
      sorting,
    },
    onSortingChange: onSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
  });

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center py-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hide-done"
            checked={hideDoneTasks}
            onCheckedChange={(checked) => setHideDoneTasks(Boolean(checked))}
          />
          <label
            htmlFor="hide-done"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Hide Done Tasks
          </label>
        </div>
      </div>
      <div className="rounded-md border flex-1 overflow-y-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {{
                        asc: ' 🔼',
                        desc: ' 🔽',
                      }[header.column.getIsSorted() as string] ?? null}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading && tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-red-500">
                  Error loading tasks: {error.message}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No tasks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-center space-x-2 py-4">
        {hasNextPage && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default TasksView;