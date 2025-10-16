import { Invoice } from '@/types';
import { PaymentStatus } from '@/types';
import BillingKanbanCard from './BillingKanbanCard';
import { Badge } from '@/components/ui/badge';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMemo } from 'react';

interface BillingKanbanColumnProps {
    status: { value: PaymentStatus; label: string };
    invoices: Invoice[];
    onEditInvoice: (invoice: Invoice) => void;
}

const BillingKanbanColumn = ({ status, invoices, onEditInvoice }: BillingKanbanColumnProps) => {
    const { setNodeRef } = useDroppable({ id: status.value });
    const invoiceIds = useMemo(() => invoices.map(i => i.rawProjectId), [invoices]);

    return (
        <div ref={setNodeRef} className="flex-shrink-0 w-72">
            <div className="h-full flex flex-col bg-muted/50 rounded-lg">
                <div className="font-semibold p-3 text-base flex items-center justify-between">
                    <h3 className="flex items-center gap-2">
                        <span>{status.label}</span>
                        <Badge variant="secondary">{invoices.length}</Badge>
                    </h3>
                </div>
                <div className="flex-grow min-h-0 overflow-y-auto p-2 pt-0">
                    <SortableContext id={status.value} items={invoiceIds} strategy={verticalListSortingStrategy}>
                        {invoices.map(invoice => (
                            <BillingKanbanCard key={invoice.id} invoice={invoice} onEdit={onEditInvoice} />
                        ))}
                    </SortableContext>
                    {invoices.length === 0 && (
                        <div className="flex items-center justify-center h-20 m-2 border-2 border-dashed border-border rounded-lg">
                            <p className="text-sm text-muted-foreground">No invoices</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BillingKanbanColumn;