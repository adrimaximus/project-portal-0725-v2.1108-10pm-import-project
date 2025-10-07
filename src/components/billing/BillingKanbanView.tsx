import { Invoice } from '@/pages/Billing';
import { PAYMENT_STATUS_OPTIONS } from '@/types';
import BillingKanbanColumn from './BillingKanbanColumn';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BillingKanbanViewProps {
  invoices: Invoice[];
}

const BillingKanbanView = ({ invoices }: BillingKanbanViewProps) => {
  const queryClient = useQueryClient();

  const { mutate: updateInvoiceStatus } = useMutation({
    mutationFn: async ({ invoiceId, newStatus }: { invoiceId: string; newStatus: string }) => {
      const { error } = await supabase
        .from('projects')
        .update({ payment_status: newStatus })
        .eq('id', invoiceId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Invoice status updated');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    updateInvoiceStatus({ invoiceId: draggableId, newStatus: destination.droppableId });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PAYMENT_STATUS_OPTIONS.map(status => (
          <BillingKanbanColumn
            key={status.value}
            status={status}
            invoices={invoices.filter(inv => inv.status === status.value)}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

export default BillingKanbanView;