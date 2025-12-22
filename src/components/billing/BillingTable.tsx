import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MoreVertical, Edit, Download, Paperclip, BellRing, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { Invoice, PaymentStatus } from "@/types";
import { useMemo } from "react";
import PaymentStatusBadge from "./PaymentStatusBadge";
import { SortableTableHead } from "../ui/SortableTableHead";

interface BillingTableProps {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onPreview: (invoice: Invoice) => void;
  sortConfig: { key: keyof Invoice | null; direction: 'asc' | 'desc' };
  handleSort: (column: keyof Invoice) => void;
  onStatusChange?: (invoiceId: string, newStatus: PaymentStatus) => void;
  stickyHeaderOffset?: string | number;
}

const getInitials = (name?: string | null) => {
  if (!name) return '';
  const names = name.split(' ').filter(Boolean);
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return names[0]?.charAt(0).toUpperCase() || '';
};

const BillingTable = ({ invoices, onEdit, onPreview, sortConfig, handleSort, onStatusChange, stickyHeaderOffset = 0 }: BillingTableProps) => {
  const sortedInvoices = useMemo(() => {
    if (!sortConfig.key) return invoices;
    return [...invoices].sort((a, b) => {
      let aValue: any = a[sortConfig.key!];
      let bValue: any = b[sortConfig.key!];
      if (sortConfig.key === 'projectOwner') {
        aValue = a.projectOwner?.name;
        bValue = b.projectOwner?.name;
      } else if (sortConfig.key === 'assignedMembers') {
        aValue = a.assignedMembers?.find(m => m.role === 'admin')?.name;
        bValue = b.assignedMembers?.find(m => m.role === 'admin')?.name;
      }

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let compareResult = 0;
      if (aValue instanceof Date && bValue instanceof Date) {
        compareResult = aValue.getTime() - bValue.getTime();
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        compareResult = aValue - bValue;
      } else {
        compareResult = String(aValue).localeCompare(String(bValue), undefined, { numeric: true, sensitivity: 'base' });
      }

      return sortConfig.direction === 'asc' ? compareResult : -compareResult;
    });
  }, [invoices, sortConfig]);

  return (
    <Table>
      <TableHeader 
        className="sticky z-40 bg-background shadow-sm"
        style={{ top: stickyHeaderOffset }}
      >
        <TableRow className="hover:bg-transparent border-none">
          <SortableTableHead columnKey="id" onSort={handleSort} sortConfig={sortConfig}>Invoice #</SortableTableHead>
          <SortableTableHead columnKey="projectName" onSort={handleSort} sortConfig={sortConfig}>Project</SortableTableHead>
          <SortableTableHead columnKey="clientName" onSort={handleSort} sortConfig={sortConfig}>Client</SortableTableHead>
          <SortableTableHead columnKey="projectOwner" onSort={handleSort} sortConfig={sortConfig}>Owner</SortableTableHead>
          <SortableTableHead columnKey="assignedMembers" onSort={handleSort} sortConfig={sortConfig}>Project Admin</SortableTableHead>
          <SortableTableHead columnKey="status" onSort={handleSort} sortConfig={sortConfig}>Status</SortableTableHead>
          <SortableTableHead columnKey="poNumber" onSort={handleSort} sortConfig={sortConfig}>PO #</SortableTableHead>
          <SortableTableHead columnKey="amount" onSort={handleSort} sortConfig={sortConfig}>Amount</SortableTableHead>
          <SortableTableHead columnKey="dueDate" onSort={handleSort} sortConfig={sortConfig}>Due Date</SortableTableHead>
          <SortableTableHead columnKey="last_billing_reminder_sent_at" onSort={handleSort} sortConfig={sortConfig}>Last Reminder</SortableTableHead>
          <TableHead>Attachment</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedInvoices.length === 0 ? (
          <TableRow>
            <TableCell colSpan={12} className="h-24 text-center">
              No invoices found.
            </TableCell>
          </TableRow>
        ) : (
          sortedInvoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell 
                className={cn(
                    "font-medium cursor-pointer hover:text-primary transition-colors", 
                    invoice.status === 'Overdue' && 'text-destructive font-semibold border-l-4 border-destructive pl-2', 
                    invoice.status === 'Paid' && 'text-green-600 font-semibold border-l-4 border-green-600 pl-2'
                )}
                onClick={() => onPreview(invoice)}
              >
                {invoice.id}
              </TableCell>
              <TableCell>
                <Link to={`/projects/${invoice.projectId}`} className="font-medium text-primary hover:underline">
                  {invoice.projectName}
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={invoice.clientAvatarUrl || invoice.clientLogo || undefined} alt={invoice.clientName || ''} />
                    <AvatarFallback>{getInitials(invoice.clientName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{invoice.clientName || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">{invoice.clientCompanyName || ''}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {invoice.projectOwner && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={invoice.projectOwner.avatar_url} alt={invoice.projectOwner.name} />
                          <AvatarFallback>{invoice.projectOwner.initials}</AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{invoice.projectOwner.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </TableCell>
              <TableCell>
                <div className="flex -space-x-2 overflow-hidden">
                  {invoice.assignedMembers
                    .filter(member => member.role === 'admin')
                    .map(admin => (
                      <TooltipProvider key={admin.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Avatar className="h-8 w-8 border-2 border-background">
                              <AvatarImage src={admin.avatar_url} alt={admin.name} />
                              <AvatarFallback>{admin.initials}</AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{admin.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                </div>
              </TableCell>
              <TableCell>
                <PaymentStatusBadge 
                  status={invoice.status} 
                  onStatusChange={onStatusChange ? (newStatus) => onStatusChange(invoice.rawProjectId, newStatus) : undefined} 
                />
              </TableCell>
              <TableCell>{invoice.poNumber || 'N/A'}</TableCell>
              <TableCell>{'Rp ' + invoice.amount.toLocaleString('id-ID')}</TableCell>
              <TableCell className={cn(invoice.status === 'Overdue' && 'text-destructive font-semibold')}>
                {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>
                {invoice.last_billing_reminder_sent_at ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(invoice.last_billing_reminder_sent_at), { addSuffix: true })}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{format(new Date(invoice.last_billing_reminder_sent_at), 'PPP p')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {invoice.invoiceAttachments && invoice.invoiceAttachments.length > 0 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex items-center gap-1 text-muted-foreground">
                        <Paperclip className="h-4 w-4" />
                        {invoice.invoiceAttachments.length}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {invoice.invoiceAttachments.map(att => (
                        <DropdownMenuItem key={att.id} asChild>
                          <a
                            href={att.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Download className="h-4 w-4" />
                            <span className="truncate" title={att.file_name}>{att.file_name}</span>
                          </a>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  'N/A'
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onPreview(invoice)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onEdit(invoice)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default BillingTable;