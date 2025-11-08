import { Invoice, PaymentStatus } from '@/types';
import BillingKanbanCard from './BillingKanbanCard';
import { Badge } from '@/components/ui/badge';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMemo } from 'react';
import { Button } from '../ui/button';
import { ChevronsLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BillingKanbanColumnProps {
    status: { value: PaymentStatus; label: string };
    invoices: Invoice[];
    onEditInvoice: (invoice: Invoice) => void;
    isCollapsed: boolean;
    onToggleCollapse: (statusValue: PaymentStatus) => void;
}

const BillingKanbanColumn = ({ status, invoices, onEditInvoice, isCollapsed, onToggleCollapse }: BillingKanbanColumnProps) => {
    const { setNodeRef } = useDroppable({ id: status.value });
    const invoiceIds = useMemo(() => invoices.map(i => i.rawProjectId), [invoices]);

    return (
        <div 
          ref={setNodeRef} 
          className={cn(
            "flex-shrink-0 transition-all duration-300 ease-in-out",
            isCollapsed ? "w-14" : "w-72"
          )}
        >
            <div className="h-full flex flex-col bg-muted/50 rounded-lg">
                <div className="font-semibold p-3 text-base flex items-center justify-between flex-shrink-0">
                    {!isCollapsed && (
                        <h3 className="flex items-center gap-2 truncate">
                            <span className="truncate">{status.label}</span>
                            <Badge variant="secondary">{invoices.length}</Badge>
                        </h3>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggleCollapse(status.value)}>
                        <ChevronsLeft className={cn("h-4 w-4 transition-transform", !isCollapsed && "rotate-180")} />
                    </Button>
                </div>
                
                {isCollapsed ? (
                    <div className="flex-grow min-h-0 flex items-center justify-center cursor-pointer p-3" onClick={() => onToggleCollapse(status.value)}>
                        <div className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap flex items-center gap-2 text-sm font-medium">
                            <span className="truncate">{status.label}</span>
                            <Badge variant="secondary">{invoices.length}</Badge>
                        </div>
                    </div>
                ) : (
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
                )}
            </div>
        </div>
    );
};

export default BillingKanbanColumn;