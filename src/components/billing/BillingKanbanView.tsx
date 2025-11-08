import { Invoice, PAYMENT_STATUS_OPTIONS, PaymentStatus, Project } from '@/types';
import BillingKanbanColumn from './BillingKanbanColumn';
import { useMemo, useState, useRef, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors, DragOverEvent } from '@dnd-kit/core';
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
    const [groupedInvoices, setGroupedInvoices] = useState<Record<string, Invoice[]>>({});
    const [collapsedColumns, setCollapsedColumns] = useState<string[]>([]);

    useEffect(() => {
        const savedState = localStorage.getItem('billingKanbanCollapsedColumns');
        if (savedState) {
            setCollapsedColumns(JSON.parse(savedState));
        }
    }, []);

    const toggleColumnCollapse = (columnId: string) => {
        const newCollapsedColumns = collapsedColumns.includes(columnId)
            ? collapsedColumns.filter(id => id !== columnId)
            : [...collapsedColumns, columnId];
        setCollapsedColumns(newCollapsedColumns);
        localStorage.setItem('billingKanbanCollapsedColumns', JSON.stringify(newCollapsedColumns));
    };

    useEffect(() => {
        if (!activeInvoice) {
            const groups: Record<string, Invoice[]> = {};
            PAYMENT_STATUS_OPTIONS.forEach(opt => {
                groups[opt.value] = [];
            });
            invoices.forEach(invoice => {
                if (groups[invoice.status]) {
                    groups[invoice.status].push(invoice);
                }
            });
            setGroupedInvoices(groups);
        }
    }, [invoices, activeInvoice]);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveInvoice(invoices.find(i => i.rawProjectId === event.active.id) || null);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;
    
        const activeId = String(active.id);
        const overId = String(over.id);
    
        if (activeId === overId) return;
    
        const activeContainer = active.data.current?.sortable.containerId as string;
        const overIsItem = !!over.data.current?.sortable;
        const overContainer = overIsItem ? over.data.current?.sortable.containerId as string : overId;
    
        if (!activeContainer || !overContainer || activeContainer === overContainer) {
          return;
        }
    
        setGroupedInvoices(prev => {
            const newGroups = { ...prev };
            const sourceItems = newGroups[activeContainer];
            const destItems = newGroups[overContainer];
            if (!sourceItems || !destItems) return prev;
    
            const activeIndex = sourceItems.findIndex(p => p.rawProjectId === activeId);
            if (activeIndex === -1) return prev;
    
            const [movedItem] = sourceItems.splice(activeIndex, 1);
    
            movedItem.status = overContainer as PaymentStatus;
            const overIndex = overIsItem ? destItems.findIndex(p => p.rawProjectId === overId) : destItems.length;
            if (overIndex !== -1) {
                destItems.splice(overIndex, 0, movedItem);
            } else {
                destItems.push(movedItem);
            }
            
            return newGroups;
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveInvoice(null);

        if (!over) return;

        const activeId = String(active.id);
        const activeContainer = active.data.current?.sortable.containerId as string;
        const overIsItem = !!over.data.current?.sortable;
        const overContainer = overIsItem ? over.data.current?.sortable.containerId as string : String(over.id);
        
        const activeInvoiceInstance = invoices.find(i => i.rawProjectId === activeId);
        if (!activeInvoiceInstance || !activeContainer || !overContainer) return;

        const newInvoicesState = Object.values(groupedInvoices).flat();

        const finalUpdates: any[] = [];
        for (const groupKey in groupedInvoices) {
            groupedInvoices[groupKey].forEach((invoice, index) => {
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
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto p-4">
                {PAYMENT_STATUS_OPTIONS.map(statusOption => (
                    <BillingKanbanColumn
                        key={statusOption.value}
                        status={statusOption}
                        invoices={groupedInvoices[statusOption.value] || []}
                        onEditInvoice={onEditInvoice}
                        isCollapsed={collapsedColumns.includes(statusOption.value)}
                        onToggleCollapse={toggleColumnCollapse}
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