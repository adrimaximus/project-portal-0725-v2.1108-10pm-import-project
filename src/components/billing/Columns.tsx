import { ColumnDef } from "@tanstack/react-table";
import { Invoice, User } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal, Paperclip, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn, getPaymentStatusStyles } from "@/lib/utils";
import { format, addDays } from 'date-fns';
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const calculateDueDate = (invoice: Invoice): string => {
    const customProps = invoice.clientCompanyCustomProperties as { [key: string]: any } | undefined;
    const topDays = customProps?.['top_days'];

    const baseDate = invoice.hardcopySendingDate || invoice.emailSendingDate;

    if (baseDate && topDays && typeof topDays === 'number' && topDays > 0) {
        const newDueDate = addDays(new Date(baseDate), topDays);
        return format(newDueDate, 'MMM dd, yyyy');
    }
    
    return invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : 'N/A';
};

export const getColumns = ({ onUpdate, currentUser }: { onUpdate: (invoiceId: string, updates: Partial<Invoice>) => void, currentUser: User | null }): ColumnDef<Invoice>[] => [
  {
    accessorKey: "projectName",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Project
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link to={`/projects/${row.original.projectId}`} className="font-medium text-primary hover:underline">
        {row.original.projectName}
      </Link>
    ),
  },
  {
    accessorKey: "clientName",
    header: "Client",
    cell: ({ row }) => (
        <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
                <AvatarImage src={row.original.clientLogo || undefined} alt={row.original.clientName || ''} />
                <AvatarFallback>{row.original.clientName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <div className="font-medium">{row.original.clientName || 'N/A'}</div>
                <div className="text-sm text-muted-foreground">{row.original.clientCompanyName || ''}</div>
            </div>
        </div>
    )
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const styles = getPaymentStatusStyles(status);
      return <Badge variant="outline" className={cn("border-transparent", styles.tw)}>{status}</Badge>;
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Amount
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => `Rp ${row.original.amount.toLocaleString('id-ID')}`,
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
    cell: ({ row }) => calculateDueDate(row.original),
  },
  {
    id: "attachments",
    header: "Attachments",
    cell: ({ row }) => {
        const attachments = row.original.invoiceAttachments;
        if (!attachments || attachments.length === 0) return "N/A";
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1 text-muted-foreground">
                        <Paperclip className="h-4 w-4" />
                        {attachments.length}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {attachments.map(att => (
                        <DropdownMenuItem key={att.id} asChild>
                            <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                {att.file_name}
                            </a>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const invoice = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(invoice.id)}>
              Copy invoice ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];