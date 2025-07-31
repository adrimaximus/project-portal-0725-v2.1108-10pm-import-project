import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Project, AssignedUser } from "@/data/projects";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { format } from "date-fns";

export const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "name",
    header: "Project Name",
    id: 'name',
    cell: ({ row }) => (
      <Link to={`/projects/${row.original.id}`} className="font-medium hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "assignedTo",
    header: "Assigned To",
    id: 'assignedTo',
    cell: ({ row }) => (
      <div className="flex -space-x-2">
        {row.original.assignedTo.map((user: AssignedUser) => (
          <Avatar key={user.id} className="h-8 w-8 border-2 border-background">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        ))}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    id: 'status',
    cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge>,
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment Status",
    id: 'paymentStatus',
    cell: ({ row }) => <Badge variant="secondary">{row.original.paymentStatus}</Badge>,
  },
  {
    accessorKey: "deadline",
    header: "Deadline",
    id: 'deadline',
    cell: ({ row }) => format(new Date(row.original.deadline), "dd MMM yyyy"),
  },
  {
    accessorKey: "paymentDueDate",
    header: "Payment Due",
    id: 'paymentDueDate',
    cell: ({ row }) => row.original.paymentDueDate ? format(new Date(row.original.paymentDueDate), "dd MMM yyyy") : 'N/A',
  },
  {
    accessorKey: "budget",
    header: "Budget",
    id: 'budget',
    cell: ({ row }) => new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(row.original.budget),
  },
];

interface ProjectsTableProps {
  columns: ColumnDef<Project>[];
  data: Project[];
}

const ProjectsTable = ({ columns, data }: ProjectsTableProps) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map(headerGroup => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map(row => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
            >
              {row.getVisibleCells().map(cell => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default ProjectsTable;