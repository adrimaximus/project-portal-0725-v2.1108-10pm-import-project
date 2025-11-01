import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MoreVertical, Edit, Download, ArrowUp, ArrowDown, Paperclip } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Invoice, PaymentStatus } from "@/types";
import { useMemo } from "react";
import PaymentStatusBadge from "./PaymentStatusBadge";

interface BillingTableProps {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  sortColumn: keyof Invoice;
  sortDirection: 'asc' | 'desc';
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

const BillingTable = ({ invoices, onEdit, sortColumn, sortDirection, handleSort, onStatusChange }: BillingTableProps) => {
  const renderSortIcon = (column: keyof Invoice) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const sortedInvoices = useMemo(() => {
    if (!sortColumn) return invoices;
    return [...invoices].sort((a, b) => {
      let aValue: any = a[sortColumn];
      let bValue: any = b[sortColumn];
      if (sortColumn === 'projectOwner') {
        aValue = a.projectOwner?.name;
        bValue = b.projectOwner?.name;
      } else if (sortColumn === 'assignedMembers') {
        aValue = a.assignedMembers?.find(m => m.role === 'admin')?.name;
        bValue = b.assignedMembers?.find(m => m.role === 'admin')?.name;
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
      }

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [invoices, sortColumn, sortDirection]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('id')} className="px-2">
              Invoice # {renderSortIcon('id')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('projectName')} className="px-2">
              Project {renderSortIcon('projectName')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('clientName')} className="px-2">
              Client {renderSortIcon('clientName')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('projectOwner')} className="px-2">
              Owner {renderSortIcon('projectOwner')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('assignedMembers')} className="px-2">
              Project Admin {renderSortIcon('assignedMembers')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('status')} className="px-2">
              Status {renderSortIcon('status')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('poNumber')} className="px-2">
              PO # {renderSortIcon('poNumber')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('amount')} className="px-2">
              Amount {renderSortIcon('amount')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('dueDate')} className="px-2">
              Due Date {renderSortIcon('dueDate')}
            </Button>
          </TableHead>
          <TableHead>Attachment</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedInvoices.length === 0 ? (
          <TableRow>
            <TableCell colSpan={11} className="h-24 text-center">
              No invoices found.
            </TableCell>
          </TableRow>
        ) : (
          sortedInvoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className={cn("font-medium", invoice.status === 'Overdue' && 'text-destructive font-semibold border-l-4 border-destructive', invoice.status === 'Paid' && 'text-green-600 font-semibold border-l-4 border-green-600')}>{invoice.id}</TableCell>
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
                  onStatusChange={(newStatus) => onStatusChange(invoice.rawProjectId, newStatus)} 
                />
              </TableCell>
              <TableCell>{invoice.poNumber || 'N/A'}</TableCell>
              <TableCell>{'Rp ' + invoice.amount.toLocaleString('id-ID')}</TableCell>
              <TableCell className={cn(invoice.status === 'Overdue' && 'text-destructive font-semibold')}>
                {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
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