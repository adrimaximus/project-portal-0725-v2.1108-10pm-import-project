import { Invoice, PAYMENT_STATUS_OPTIONS, PaymentStatus, Project } from '@/types';
import BillingKanbanColumn from './BillingKanbanColumn';
import { useMemo, useState, useRef } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useProjectKanbanMutations } from '@/hooks/useProjectKanbanMutations';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { format } from 'date-fns';

interface BillingKanbanViewProps {
    invoices: Invoice[];
    onEditInvoice: (invoice: Invoice) => void;
}

const BillingKanbanView = ({ invoices, onEditInvoice }: BillingKanbanViewProps) => {
    const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
    const { updateProjectOrder } = useProjectKanbanMutations();

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

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveInvoice(invoices.find(i => i.rawProjectId === event.active.id) || null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveInvoice(null);

        if (!over) return;

        const activeId = String(active.id);
        const overId = String(over.id);

        const activeContainer = active.data.current?.sortable.containerId as string;
        let overContainer = over.data.current?.sortable.containerId as string;
        if (!overContainer) overContainer = overId;
        
        const activeInvoiceInstance = invoices.find(i => i.rawProjectId === activeId);
        if (!activeInvoiceInstance || !activeContainer || !overContainer) return;

        let newInvoicesState = [...invoices];
        const activeIndex = newInvoicesState.findIndex(i => i.rawProjectId === activeId);

        if (activeIndex === -1) return;

        if (activeContainer === overContainer) {
            const overIndex = newInvoicesState.findIndex(i => i.rawProjectId === overId);
            if (overIndex !== -1) {
                newInvoicesState = arrayMove(newInvoicesState, activeIndex, overIndex);
            }
        } else {
            const [movedItem] = newInvoicesState.splice(activeIndex, 1);
            movedItem.status = overContainer as PaymentStatus;

            const overIsItem = !!over.data.current?.sortable;
            const overIndex = overIsItem ? newInvoicesState.findIndex(i => i.rawProjectId === overId) : -1;
            
            if (overIndex !== -1) {
                newInvoicesState.splice(overIndex, 0, movedItem);
            } else {
                const itemsInDest = newInvoicesState.filter(i => i.status === overContainer);
                if (itemsInDest.length > 0) {
                    const lastItem = itemsInDest[itemsInDest.length - 1];
                    const lastItemIndex = newInvoicesState.findIndex(i => i.id === lastItem.id);
                    newInvoicesState.splice(lastItemIndex + 1, 0, movedItem);
                } else {
                    newInvoicesState.push(movedItem);
                }
            }
        }

        const finalUpdates: any[] = [];
        const finalInvoiceGroups = newInvoicesState.reduce((acc, p) => {
            const key = p.status as string;
            if (!acc[key]) acc[key] = [];
            acc[key].push(p);
            return acc;
        }, {} as Record<string, Invoice[]>);

        for (const groupKey in finalInvoiceGroups) {
            finalInvoiceGroups[groupKey].forEach((invoice, index) => {
                finalUpdates.push({
                    project_id: invoice.rawProjectId,
                    kanban_order: index,
                    payment_status: groupKey,
                });
            });
        }

        if (finalUpdates.length > 0) {
            const newStatusLabel = PAYMENT_STATUS_OPTIONS.find(opt => opt.value === overContainer)?.label || overContainer;
            updateProjectOrder({
                newProjects: newInvoicesState.map(inv => ({ ...inv, id: inv.rawProjectId } as unknown as Project)),
                finalUpdates,
                groupBy: 'payment_status',
                activeProjectName: activeInvoiceInstance.projectName,
                newStatusLabel,
                movedColumns: activeContainer !== overContainer,
            });
        }
    };

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
            <DragOverlay>
                {activeInvoice ? (
                    <Card className="shadow-xl w-72">
                        <CardContent className="p-3">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">{activeInvoice.id}</p>
                                <h4 className="font-semibold text-sm leading-snug">{activeInvoice.projectName}</h4>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={activeInvoice.clientLogo || undefined} alt={activeInvoice.clientName || ''} />
                                    <AvatarFallback>{activeInvoice.clientName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-xs font-medium">{activeInvoice.clientName}</p>
                                    <p className="text-xs text-muted-foreground">{activeInvoice.clientCompanyName}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-end mt-3">
                                <div className="text-sm">
                                    <p className="text-xs text-muted-foreground">Amount</p>
                                    <p className="font-semibold">{'Rp ' + activeInvoice.amount.toLocaleString('id-ID')}</p>
                                </div>
                                <div className="text-right text-sm">
                                    <p className="text-xs text-muted-foreground">Due</p>
                                    <p className="font-semibold">{format(activeInvoice.dueDate, 'MMM dd, yyyy')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default BillingKanbanView;