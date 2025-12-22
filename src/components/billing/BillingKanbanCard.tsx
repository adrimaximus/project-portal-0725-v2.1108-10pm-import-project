import { Invoice } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit, BellRing } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format, formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BillingKanbanCardProps {
    invoice: Invoice;
    onEdit: (invoice: Invoice) => void;
    onClick?: () => void;
}

const BillingKanbanCard = ({ invoice, onEdit, onClick }: BillingKanbanCardProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
      id: invoice.rawProjectId,
      data: {
        type: 'Invoice',
        invoice,
      }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : undefined,
    };

    const getStatusColor = (status?: string) => {
        const s = status?.toLowerCase() || '';
        if (s === 'paid') return '#22c55e'; // green-500
        if (s === 'pending' || s === 'proposed' || s === 'sent') return '#eab308'; // yellow-500
        if (s === 'cancelled' || s === 'void' || s === 'rejected') return '#ef4444'; // red-500
        return '#cbd5e1'; // slate-300
    };

    const borderColor = getStatusColor(invoice.payment_status);

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn(isDragging && "opacity-30")}>
            <Card 
                className="mb-3 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing border-l-4"
                style={{ borderLeftColor: borderColor }}
                onClick={onClick}
            >
                <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">{invoice.invoiceNumber || 'No Ref'}</p>
                            <h4 className="font-semibold text-sm leading-snug line-clamp-2">{invoice.projectName}</h4>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => onEdit(invoice)}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={invoice.clientLogo || undefined} alt={invoice.clientName || ''} />
                            <AvatarFallback>{invoice.clientName?.charAt(0) || 'C'}</AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                            <p className="text-xs font-medium truncate">{invoice.clientName || 'Unknown Client'}</p>
                            <p className="text-xs text-muted-foreground truncate">{invoice.clientCompanyName}</p>
                        </div>
                    </div>
                    <div className="flex justify-between items-end mt-3">
                        <div className="text-sm">
                            <p className="text-xs text-muted-foreground">Amount</p>
                            <p className="font-semibold">{'Rp ' + (invoice.amount || 0).toLocaleString('id-ID')}</p>
                        </div>
                        <div className="text-right text-sm flex items-center gap-2">
                          {invoice.last_billing_reminder_sent_at && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <BellRing className="h-3.5 w-3.5 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Last reminder sent {formatDistanceToNow(new Date(invoice.last_billing_reminder_sent_at), { addSuffix: true })}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <div>
                            <p className="text-xs text-muted-foreground">Due</p>
                            <p className="font-semibold">{invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd') : '-'}</p>
                          </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default BillingKanbanCard;