import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Invoice } from '@/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarUrl, generatePastelColor, cn } from '@/lib/utils';
import { Building2, Calendar, CreditCard, Download, Edit, Eye, FileText, User, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface InvoicePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onEdit: (invoice: Invoice) => void;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
}).format(amount);

const getStatusBadgeStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-700/50';
      case 'pending': 
      case 'proposed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700/50';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-700/50';
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-700/50';
    }
};

export const InvoicePreviewDialog = ({ open, onOpenChange, invoice, onEdit }: InvoicePreviewDialogProps) => {
  if (!invoice) return null;

  const totalPaid = (invoice.payment_terms as any[])?.reduce((sum, term) => {
      return sum + (term.status === 'Paid' ? (Number(term.amount) || 0) : 0);
  }, 0) || 0;
  
  const balance = invoice.amount - totalPaid;

  const handleEditClick = () => {
      onEdit(invoice);
      // We don't close this dialog here, let the parent handle it if needed, 
      // but usually we want to switch context. The parent logic handles opening edit dialog.
      onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
                <DialogTitle className="text-xl">{invoice.id}</DialogTitle>
                <DialogDescription>
                    Project: <Link to={`/projects/${invoice.projectId}`} className="text-primary hover:underline">{invoice.projectName}</Link>
                </DialogDescription>
            </div>
            <Badge variant="outline" className={cn("px-3 py-1 text-sm font-medium capitalize", getStatusBadgeStyle(invoice.status))}>
                {invoice.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid gap-6 py-4">
            {/* Amount Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/30 p-4 rounded-lg border">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Amount</p>
                    <p className="text-lg font-bold mt-1">{formatCurrency(invoice.amount)}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg border">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Paid</p>
                    <p className="text-lg font-bold mt-1 text-green-600">{formatCurrency(totalPaid)}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg border">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Balance</p>
                    <p className={cn("text-lg font-bold mt-1", balance > 0 ? "text-red-500" : "text-muted-foreground")}>
                        {formatCurrency(balance)}
                    </p>
                </div>
            </div>

            {/* Stakeholders Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <User className="h-4 w-4" /> Client
                    </h4>
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={invoice.clientAvatarUrl || invoice.clientLogo || undefined} />
                            <AvatarFallback>{invoice.clientName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                            <p className="font-medium text-sm truncate" title={invoice.clientName || 'Unknown'}>{invoice.clientName || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground truncate" title={invoice.clientCompanyName || ''}>{invoice.clientCompanyName}</p>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <UserCheck className="h-4 w-4" /> Project Owner
                    </h4>
                    {invoice.projectOwner ? (
                        <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={invoice.projectOwner.avatar_url || undefined} />
                                <AvatarFallback style={generatePastelColor(invoice.projectOwner.id)}>{invoice.projectOwner.initials}</AvatarFallback>
                            </Avatar>
                            <div className="overflow-hidden">
                                <p className="font-medium text-sm truncate" title={invoice.projectOwner.name}>{invoice.projectOwner.name}</p>
                                <p className="text-xs text-muted-foreground truncate" title={invoice.projectOwner.email || ''}>{invoice.projectOwner.email}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 border rounded-lg bg-muted/20 text-muted-foreground text-sm italic">
                            No owner assigned
                        </div>
                    )}
                </div>

                <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Building2 className="h-4 w-4" /> Project Admin
                    </h4>
                    <div className="flex flex-col gap-2">
                        {invoice.assignedMembers.filter(m => m.role === 'admin').map(admin => (
                            <div key={admin.id} className="flex items-center gap-2 p-2 border rounded-lg bg-card text-sm">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={admin.avatar_url || undefined} />
                                    <AvatarFallback style={generatePastelColor(admin.id)}>{admin.initials}</AvatarFallback>
                                </Avatar>
                                <span className="truncate" title={admin.name}>{admin.name}</span>
                            </div>
                        ))}
                        {invoice.assignedMembers.filter(m => m.role === 'admin').length === 0 && (
                            <p className="text-sm text-muted-foreground italic">No admins assigned</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Dates & PO */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                    <p className="text-muted-foreground text-xs">Due Date</p>
                    <p className="font-medium flex items-center gap-1.5 mt-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                    </p>
                </div>
                <div>
                    <p className="text-muted-foreground text-xs">PO Number</p>
                    <p className="font-medium mt-1">{invoice.poNumber || '-'}</p>
                </div>
                <div>
                    <p className="text-muted-foreground text-xs">Channel</p>
                    <p className="font-medium mt-1">{invoice.channel || '-'}</p>
                </div>
                 <div>
                    <p className="text-muted-foreground text-xs">Last Reminder</p>
                    <p className="font-medium mt-1">
                        {invoice.last_billing_reminder_sent_at 
                            ? formatDistanceToNow(new Date(invoice.last_billing_reminder_sent_at), { addSuffix: true }) 
                            : '-'}
                    </p>
                </div>
            </div>

            <Separator />

            {/* Payment Terms */}
            {(invoice.payment_terms as any[])?.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" /> Payment Terms
                    </h4>
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground text-xs">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium">Term</th>
                                    <th className="px-3 py-2 text-left font-medium">Amount</th>
                                    <th className="px-3 py-2 text-left font-medium">Due Date</th>
                                    <th className="px-3 py-2 text-right font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {(invoice.payment_terms as any[]).map((term, idx) => (
                                    <tr key={idx}>
                                        <td className="px-3 py-2">#{idx + 1}</td>
                                        <td className="px-3 py-2 font-medium">{formatCurrency(term.amount || 0)}</td>
                                        <td className="px-3 py-2 text-muted-foreground">
                                            {term.release_date ? format(new Date(term.release_date), 'dd MMM yyyy') : '-'}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <Badge variant="outline" className={cn("text-[10px] font-normal", getStatusBadgeStyle(term.status || 'Pending'))}>
                                                {term.status || 'Pending'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Attachments */}
            {invoice.invoiceAttachments?.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Attachments
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {invoice.invoiceAttachments.map(file => (
                            <div key={file.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/20 text-sm">
                                <span className="truncate flex-1 mr-2" title={file.file_name}>{file.file_name}</span>
                                <div className="flex gap-1">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                                    <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </a>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>View</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                                    <a href={file.file_url} download={file.file_name}>
                                                        <Download className="h-3.5 w-3.5" />
                                                    </a>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Download</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>

        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button onClick={handleEditClick}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Invoice
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};