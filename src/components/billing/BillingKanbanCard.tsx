import { Invoice } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface BillingKanbanCardProps {
    invoice: Invoice;
    onEdit: (invoice: Invoice) => void;
}

const BillingKanbanCard = ({ invoice, onEdit }: BillingKanbanCardProps) => {
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

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn(isDragging && "opacity-30")}>
            <Card className="mb-3 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
                <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">{invoice.id}</p>
                            <h4 className="font-semibold text-sm leading-snug">{invoice.projectName}</h4>
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
                            <AvatarFallback>{invoice.clientName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-xs font-medium">{invoice.clientName}</p>
                            <p className="text-xs text-muted-foreground">{invoice.clientCompanyName}</p>
                        </div>
                    </div>
                    <div className="flex justify-between items-end mt-3">
                        <div className="text-sm">
                            <p className="text-xs text-muted-foreground">Amount</p>
                            <p className="font-semibold">{'Rp ' + invoice.amount.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="text-right text-sm">
                            <p className="text-xs text-muted-foreground">Due</p>
                            <p className="font-semibold">{format(invoice.dueDate, 'MMM dd, yyyy')}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default BillingKanbanCard;