import { Invoice } from '@/pages/Billing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getPaymentStatusStyles, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Draggable } from '@hello-pangea/dnd';

interface BillingKanbanCardProps {
  invoice: Invoice;
  index: number;
}

const BillingKanbanCard = ({ invoice, index }: BillingKanbanCardProps) => {
  return (
    <Draggable draggableId={invoice.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-3"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-sm">{invoice.projectName}</h3>
                <Badge variant="outline" className={cn("border-transparent text-xs", getPaymentStatusStyles(invoice.status).className)}>
                  {invoice.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-1">{invoice.clientName}</p>
              <p className="text-sm font-bold mb-2">
                Rp{new Intl.NumberFormat('id-ID').format(invoice.amount)}
              </p>
              <p className="text-xs text-muted-foreground">
                Due: {invoice.dueDate ? format(new Date(invoice.dueDate), 'dd MMM yyyy') : 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};

export default BillingKanbanCard;