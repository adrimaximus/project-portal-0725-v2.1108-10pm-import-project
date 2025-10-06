import { Invoice } from '@/pages/Billing';
import { PAYMENT_STATUS_OPTIONS } from '@/types';
import BillingKanbanColumn from './BillingKanbanColumn';
import { useMemo } from 'react';

interface BillingKanbanViewProps {
    invoices: Invoice[];
    onEditInvoice: (invoice: Invoice) => void;
}

const BillingKanbanView = ({ invoices, onEditInvoice }: BillingKanbanViewProps) => {
    const groupedInvoices = useMemo(() => {
        const groups: Record<string, Invoice[]> = {};
        PAYMENT_STATUS_OPTIONS.forEach(opt => {
            groups[opt.value] = [];
        });
        invoices.forEach(invoice => {
            if (groups[invoice.status]) {
                groups[invoice.status].push(invoice);
            }
        });
        return groups;
    }, [invoices]);

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 p-4">
            {PAYMENT_STATUS_OPTIONS.map(statusOption => (
                <BillingKanbanColumn
                    key={statusOption.value}
                    status={statusOption}
                    invoices={groupedInvoices[statusOption.value] || []}
                    onEditInvoice={onEditInvoice}
                />
            ))}
        </div>
    );
};

export default BillingKanbanView;