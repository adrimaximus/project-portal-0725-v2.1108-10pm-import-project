import { Invoice } from '@/pages/Billing';
import { PaymentStatus } from '@/types';
import BillingKanbanCard from './BillingKanbanCard';
import { Droppable } from '@hello-pangea/dnd';

interface BillingKanbanColumnProps {
  status: PaymentStatus;
  invoices: Invoice[];
}

const BillingKanbanColumn = ({ status, invoices }: BillingKanbanColumnProps) => {
  return (
    <div className="w-72 flex-shrink-0 bg-muted/50 rounded-lg p-2">
      <h3 className="font-semibold text-sm p-2 mb-2">{status.label} ({invoices.length})</h3>
      <Droppable droppableId={status.value}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[200px] transition-colors ${snapshot.isDraggingOver ? 'bg-muted' : ''}`}
          >
            {invoices.map((invoice, index) => (
              <BillingKanbanCard key={invoice.id} invoice={invoice} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default BillingKanbanColumn;