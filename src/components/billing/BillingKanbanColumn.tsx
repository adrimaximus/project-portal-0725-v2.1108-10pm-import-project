import { Invoice } from '@/pages/Billing';
import { PaymentStatus } from '@/types';
import BillingKanbanCard from './BillingKanbanCard';
import { Badge } from '@/components/ui/badge';

interface BillingKanbanColumnProps {
    status: { value: PaymentStatus; label: string };
    invoices: Invoice[];
    onEditInvoice: (invoice: Invoice) => void;
}

const BillingKanbanColumn = ({ status, invoices, onEditInvoice }: BillingKanbanColumnProps) => {
    return (
        <div className="flex-shrink-0 w-72">
            <div className="h-full flex flex-col bg-muted/50 rounded-lg">
                <div className="font-semibold p-3 text-base flex items-center justify-between">
                    <h3 className="flex items-center gap-2">
                        <span>{status.label}</span>
                        <Badge variant="secondary">{invoices.length}</Badge>
                    </h3>
                </div>
                <div className="flex-grow min-h-0 overflow-y-auto p-2 pt-0">
                    {invoices.map(invoice => (
                        <BillingKanbanCard key={invoice.id} invoice={invoice} onEdit={onEditInvoice} />
                    ))}
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