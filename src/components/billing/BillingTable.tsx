import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MoreVertical, Edit, Download, ArrowUp, ArrowDown, Paperclip } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, getPaymentStatusStyles } from "@/lib/utils";
import { format } from "date-fns";
import { Invoice } from "@/types";

interface BillingTableProps {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  sortColumn: keyof Invoice;
  sortDirection: 'asc' | 'desc';
  handleSort: (column: keyof Invoice) => void;
}

const BillingTable = ({ invoices, onEdit, sortColumn, sortDirection, handleSort }: BillingTableProps) => {
  const renderSortIcon = (column: keyof Invoice) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

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
        {invoices.length === 0 ? (
          <TableRow>
            <TableCell colSpan={11} className="h-24 text-center">
              No invoices found.
            </TableCell>
          </TableRow>
        ) : (
          invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">{invoice.id}</TableCell>
              <TableCell>
                <Link to={`/projects/${invoice.projectId}`} className="font-medium text-primary hover:underline">
                  {invoice.projectName}
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={invoice.clientLogo || undefined} alt={invoice.clientName || ''} />
                    <AvatarFallback>{invoice.clientName?.charAt(0)}</AvatarFallback>
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
                <Badge variant="outline" className={cn("border-transparent", getPaymentStatusStyles(invoice.status).tw)}>
                  {invoice.status}
                </Badge>
              </TableCell>
              <TableCell>{invoice.poNumber || 'N/A'}</TableCell>
              <TableCell>{'Rp ' + invoice.amount.toLocaleString('id-ID')}</TableCell>
              <TableCell>{format(invoice.dueDate, 'MMM dd, yyyy')}</TableCell>
              <TableCell>
                {invoice.invoiceAttachmentUrl ? (
                  <a
                    href={invoice.invoiceAttachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                    title={invoice.invoiceAttachmentName || 'View Attachment'}
                  >
                    <Paperclip className="h-4 w-4" />
                    <span>View</span>
                  </a>
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
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" />
                      Download
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