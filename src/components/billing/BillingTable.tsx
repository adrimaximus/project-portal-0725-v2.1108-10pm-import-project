import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MoreVertical, Edit, Download, Paperclip } from "lucide-react";
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
  sortConfig: { key: keyof Invoice | null; direction: 'asc' | 'desc' };
  handleSort: (column: keyof Invoice) => void;
  onStatusChange: (invoiceId: string, newStatus: PaymentStatus) => void;
}

const getInitials = (name?: string | null) => {
  if (!name) return '';
  const names = name.split(' ').filter(Boolean);
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return names[0]?.charAt(0).toUpperCase() || '';
};

const BillingTable = ({ invoices, onEdit, sortConfig, handleSort, onStatusChange }: BillingTableProps) => {
  const sortedInvoices = useMemo(() => {
    if (!sortConfig.key) return invoices;
    
    const sorted = [...invoices].sort((a, b) => {
      let aValue: any = a[sortConfig.key!];
      let bValue: any = b[sortConfig.key!];
      
      // Custom accessor logic for complex fields
      if (sortConfig.key === 'projectOwner') {
        aValue = a.projectOwner?.name || '';
        bValue = b.projectOwner?.name || '';
      } else if (sortConfig.key === 'assignedMembers') {
        aValue = a.assignedMembers?.find(m => m.role === 'admin')?.name || '';
        bValue = b.assignedMembers?.find(m => m.role === 'admin')?.name || '';
      }

      // Ensure we're comparing comparable types or fall back to string
      // Handle null/undefined - always put at bottom regardless of direction if desired, 
      // or let direction handle it. Here we put them at the end for simplicity in default sort.
      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let compareResult = 0;
      
      if (aValue instanceof Date && bValue instanceof Date) {
        compareResult = aValue.getTime() - bValue.getTime();
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        compareResult = aValue - bValue;
      } else {
        // String comparison with numeric awareness (e.g. "Invoice 2" comes before "Invoice 10")
        compareResult = String(aValue).localeCompare(String(bValue), undefined, { numeric: true, sensitivity: 'base' });
      }

      return sortConfig.direction === 'asc' ? compareResult : -compareResult;
    });

    return sorted;
  }, [invoices, sortConfig]);

  return (
    <div className="rounded-md border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <SortableTableHead columnKey="id" onSort={handleSort} sortConfig={sortConfig} className="w-[120px]">Invoice #</SortableTableHead>
            <SortableTableHead columnKey="projectName" onSort={handleSort} sortConfig={sortConfig}>Project</SortableTableHead>
            <SortableTableHead columnKey="clientName" onSort={handleSort} sortConfig={sortConfig}>Client</SortableTableHead>
            <SortableTableHead columnKey="projectOwner" onSort={handleSort} sortConfig={sortConfig}>Owner</SortableTableHead>
            <SortableTableHead columnKey="assignedMembers" onSort={handleSort} sortConfig={sortConfig}>Admin</SortableTableHead>
            <SortableTableHead columnKey="status" onSort={handleSort} sortConfig={sortConfig}>Status</SortableTableHead>
            <SortableTableHead columnKey="poNumber" onSort={handleSort} sortConfig={sortConfig}>PO #</SortableTableHead>
            <SortableTableHead columnKey="amount" onSort={handleSort} sortConfig={sortConfig}>Amount</SortableTableHead>
            <SortableTableHead columnKey="dueDate" onSort={handleSort} sortConfig={sortConfig}>Due Date</SortableTableHead>
            <SortableTableHead columnKey="last_billing_reminder_sent_at" onSort={handleSort} sortConfig={sortConfig}>Reminder</SortableTableHead>
            <TableHead>Attachment</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedInvoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={12} className="h-24 text-center text-muted-foreground">
                No invoices found.
              </TableCell>
            </TableRow>
          ) : (
            sortedInvoices.map((invoice) => (
              <TableRow key={invoice.id} className="hover:bg-muted/50">
                <TableCell className={cn("font-medium", invoice.status === 'Overdue' && 'text-destructive font-semibold border-l-4 border-destructive pl-4', invoice.status === 'Paid' && 'text-green-600 font-semibold border-l-4 border-green-600 pl-4')}>{invoice.id}</TableCell>
                <TableCell>
                  <Link to={`/projects/${invoice.projectId}`} className="font-medium text-primary hover:underline truncate block max-w-[200px]" title={invoice.projectName}>
                    {invoice.projectName}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={invoice.clientAvatarUrl || invoice.clientLogo || undefined} alt={invoice.clientName || ''} />
                      <AvatarFallback>{getInitials(invoice.clientName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col max-w-[150px]">
                      <span className="font-medium truncate text-sm" title={invoice.clientName || ''}>{invoice.clientName || 'N/A'}</span>
                      <span className="text-xs text-muted-foreground truncate" title={invoice.clientCompanyName || ''}>{invoice.clientCompanyName || ''}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {invoice.projectOwner && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Avatar className="h-8 w-8 cursor-help">
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
                              <Avatar className="h-8 w-8 border-2 border-background cursor-help">
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
                    onStatusChange={(newStatus) => onStatusChange(invoice.rawProjectId, newStatus)} 
                  />
                </TableCell>
                <TableCell className="text-sm">{invoice.poNumber || '-'}</TableCell>
                <TableCell className="font-medium">{'Rp ' + invoice.amount.toLocaleString('id-ID')}</TableCell>
                <TableCell className={cn("text-sm", invoice.status === 'Overdue' && 'text-destructive font-medium')}>
                  {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : '-'}
                </TableCell>
                <TableCell>
                  {invoice.last_billing_reminder_sent_at ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="text-xs text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/50">
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
                        <Button variant="ghost" size="sm" className="flex items-center gap-1 text-muted-foreground h-8">
                          <Paperclip className="h-4 w-4" />
                          <span className="text-xs">{invoice.invoiceAttachments.length}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        {invoice.invoiceAttachments.map(att => (
                          <DropdownMenuItem key={att.id} asChild>
                            <a
                              href={att.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 cursor-pointer w-full"
                            >
                              <Download className="h-4 w-4" />
                              <span className="truncate flex-1" title={att.file_name}>{att.file_name}</span>
                            </a>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="text-muted-foreground text-xs px-2">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => onEdit(invoice)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Invoice
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default BillingTable;