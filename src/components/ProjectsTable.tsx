"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Download, Pencil, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Project } from "@/data/projects"
import { useNavigate } from "react-router-dom"
import { useIsMobile } from "@/hooks/use-mobile"
import { Card } from "@/components/ui/card"

const getStatusBadgeVariant = (status: Project["status"]) => {
  switch (status) {
    case "Completed":
    case "Done":
    case "Billed":
      return "default"
    case "In Progress":
      return "secondary"
    case "On Hold":
    case "Cancelled":
      return "destructive"
    default:
      return "outline"
  }
}

export const columns: ColumnDef<Project>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
            ? "indeterminate"
            : false
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="opacity-100"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Project Name",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "assignedTo",
    header: "Assigned To",
    cell: ({ row }) => {
      const assignedUsers = row.original.assignedTo;
      if (!assignedUsers || assignedUsers.length === 0) {
        return <span className="text-muted-foreground">Unassigned</span>;
      }

      if (assignedUsers.length === 1) {
        const user = assignedUsers[0];
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
            </Avatar>
            <span className="font-medium truncate max-w-[120px]">{user.name}</span>
          </div>
        );
      }

      const visibleUsers = assignedUsers.slice(0, 3);
      const remainingCount = assignedUsers.length - visibleUsers.length;

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center -space-x-2">
                {visibleUsers.map((user) => (
                  <Avatar key={user.name} className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                  </Avatar>
                ))}
                {remainingCount > 0 && (
                  <Avatar className="h-8 w-8 border-2 border-background">
                    <AvatarFallback>+{remainingCount}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <ul className="list-none p-0 m-0 space-y-1">
                {assignedUsers.map((user) => (
                  <li key={user.name}>{user.name}</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={getStatusBadgeVariant(row.getValue("status"))}>
        {row.getValue("status")}
      </Badge>
    ),
  },
  {
    accessorKey: "progress",
    header: "Progress",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Progress value={row.getValue("progress")} className="w-24" />
        <span>{row.getValue("progress")}%</span>
      </div>
    ),
  },
  {
    accessorKey: "startDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Start Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const startDate = row.getValue("startDate") as string;
      if (!startDate) return <span className="text-muted-foreground">-</span>;
      return <div>{format(new Date(startDate), "dd MMM yyyy")}</div>
    },
  },
  {
    accessorKey: "deadline",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Due Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const deadline = row.getValue("deadline") as string;
      if (!deadline) return <span className="text-muted-foreground">-</span>;
      return <div>{format(new Date(deadline), "dd MMM yyyy")}</div>
    },
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment Status",
    cell: ({ row }) => {
      const paymentStatus = row.original.paymentStatus;
      
      const getPaymentStatusBadgeVariant = (s: Project["paymentStatus"]) => {
        switch (s) {
          case "paid": return "default";
          case "approved":
          case "po_created":
          case "on_process":
          case "pending": 
            return "secondary";
          case "cancelled": 
            return "destructive";
          case "proposed": 
            return "outline";
          default: 
            return "outline";
        }
      }

      const formatPaymentStatus = (status: Project["paymentStatus"]) => {
        switch (status) {
          case "po_created":
            return "PO Created";
          case "on_process":
            return "On Process";
          default:
            return status.charAt(0).toUpperCase() + status.slice(1);
        }
      };

      return (
        <Badge variant={getPaymentStatusBadgeVariant(paymentStatus)}>
          {formatPaymentStatus(paymentStatus)}
        </Badge>
      )
    },
  },
  {
    accessorKey: "paymentDueDate",
    header: "Payment Due",
    cell: ({ row }) => {
      const paymentDueDate = row.getValue("paymentDueDate") as string | undefined;
      if (!paymentDueDate) {
        return <span className="text-muted-foreground">-</span>
      }
      
      const dueDate = new Date(paymentDueDate);
      return <div>{format(dueDate, "dd MMM yyyy")}</div>
    },
  },
  {
    accessorKey: "tickets",
    header: "Tickets",
    cell: ({ row }) => {
      const ticketCount = row.original.tickets || 0;
      return (
        <div>
          <div className="font-medium">{ticketCount}</div>
          <div className="text-xs text-muted-foreground">{ticketCount === 1 ? 'open ticket' : 'open tickets'}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "budget",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Budget
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("budget"))
      const formatted = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(amount)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const project = row.original
      const navigate = useNavigate();

      return (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}`)}>
                <Pencil className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!project.invoiceAttachmentUrl}
                onSelect={() => {
                  if (project.invoiceAttachmentUrl) {
                    window.open(project.invoiceAttachmentUrl, "_blank");
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Invoice Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]

interface ProjectsTableProps {
  columns: ColumnDef<Project>[];
  data: Project[];
  onFilteredDataChange?: (filteredData: Project[]) => void;
}

export default function ProjectsTable({ columns, data, onFilteredDataChange }: ProjectsTableProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  React.useEffect(() => {
    if (onFilteredDataChange) {
      const filteredRows = table.getFilteredRowModel().rows;
      const filteredData = filteredRows.map(row => row.original);
      onFilteredDataChange(filteredData);
    }
  }, [table.getFilteredRowModel().rows, onFilteredDataChange, table]);

  if (isMobile) {
    return (
      <div className="space-y-4">
        <Input
          placeholder="Filter projects..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="w-full"
        />
        <div className="space-y-3">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              const project = row.original;
              return (
                <Card 
                  key={project.id} 
                  className="w-full"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className="flex items-start p-4">
                    <div className="flex-grow space-y-2">
                      <h3 className="font-semibold leading-snug">{project.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant={getStatusBadgeVariant(project.status)}>{project.status}</Badge>
                        <span className="text-xs">•</span>
                        <span className="text-xs">Due: {format(new Date(project.deadline), "dd MMM yyyy")}</span>
                      </div>
                      <div className="text-sm pt-1">
                        <span className="font-medium">Budget: </span>
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(project.budget)}
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}`)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!project.invoiceAttachmentUrl}
                            onSelect={() => {
                              if (project.invoiceAttachmentUrl) {
                                window.open(project.invoiceAttachmentUrl, "_blank");
                              }
                            }}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Invoice Link
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              )
            })
          ) : (
            <div className="text-center text-muted-foreground py-10">
              No results.
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter projects..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/projects/${row.original.id}`)}
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
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
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
  )
}