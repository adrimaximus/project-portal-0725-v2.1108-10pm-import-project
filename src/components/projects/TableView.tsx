import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Project } from "@/types";
import { Link } from "react-router-dom";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import StatusBadge from "../StatusBadge";
import { getStatusStyles, cn, formatInJakarta } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  PaginationState,
} from "@tanstack/react-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TableViewProps {
  projects: Project[];
  isLoading: boolean;
  onDeleteProject: (projectId: string) => void;
}

const paymentStatusConfig: Record<string, { color: string; label: string }> = {
  'Paid': { color: "bg-green-100 text-green-800", label: "Paid" },
  'Pending': { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  'In Process': { color: "bg-purple-100 text-purple-800", label: "In Process" },
  'Overdue': { color: "bg-red-100 text-red-800", label: "Overdue" },
  'Proposed': { color: "bg-blue-100 text-blue-800", label: "Proposed" },
  'Cancelled': { color: "bg-gray-100 text-gray-800", label: "Cancelled" },
};

const TableView = ({ projects, isLoading, onDeleteProject }: TableViewProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns = useMemo<ColumnDef<Project>[]>(() => [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Project
        </Button>
      ),
      cell: ({ row }) => {
        const project = row.original;
        return (
          <div style={{ borderLeft: `4px solid ${getStatusStyles(project.status).hex}`, paddingLeft: '1rem' }}>
            <Link to={`/projects/${project.slug}`} className="font-medium text-primary hover:underline">
              {project.name}
            </Link>
            <div className="text-sm text-muted-foreground">{project.category}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Status
        </Button>
      ),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "payment_status",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Payment
        </Button>
      ),
      cell: ({ row }) => {
        const paymentBadgeColor = paymentStatusConfig[row.original.payment_status]?.color || "bg-gray-100 text-gray-800";
        return (
          <Badge variant="outline" className={cn("border-transparent font-normal", paymentBadgeColor)}>
            {row.original.payment_status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "progress",
      header: "Progress",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Progress value={row.original.progress} className="h-2" />
          <span className="text-sm text-muted-foreground">{row.original.progress}%</span>
        </div>
      ),
    },
    {
      accessorKey: "start_date",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Start Date
        </Button>
      ),
      cell: ({ row }) => formatInJakarta(row.original.start_date, 'MMM d, yyyy'),
    },
    {
      accessorKey: "due_date",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Due Date
        </Button>
      ),
      cell: ({ row }) => formatInJakarta(row.original.due_date, 'MMM d, yyyy'),
    },
    {
      accessorKey: "venue",
      header: "Venue",
      cell: ({ row }) => (
        row.original.venue ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <p className="truncate max-w-[160px]">{row.original.venue}</p>
              </TooltipTrigger>
              <TooltipContent>
                <p>{row.original.venue}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : ('-')
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onDeleteProject(row.original.id)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Hapus Proyek</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [onDeleteProject]);

  const table = useReactTable({
    data: projects,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
      <div className="rounded-md border overflow-y-auto max-h-[calc(100vh-25rem)]">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading projects...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No projects found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} project(s).
        </div>
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TableView;