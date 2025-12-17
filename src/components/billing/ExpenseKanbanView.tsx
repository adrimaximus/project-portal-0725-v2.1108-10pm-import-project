import { Expense } from '@/types';
import ExpenseKanbanColumn from './ExpenseKanbanColumn';
import { useState, useEffect, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors, DragOverEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import ExpenseKanbanCard from './ExpenseKanbanCard';

interface ExpenseKanbanViewProps {
  expenses: Expense[];
  statuses: string[];
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
  canEditStatus: boolean;
}

const ExpenseKanbanView = ({ expenses, statuses, onEditExpense, onDeleteExpense, canEditStatus }: ExpenseKanbanViewProps) => {
  const [activeExpense, setActiveExpense] = useState<Expense | null>(null);
  const [groupedExpenses, setGroupedExpenses] = useState<Record<string, Expense[]>>({});
  const queryClient = useQueryClient();

  useEffect(() => {
    const groups: Record<string, Expense[]> = {};
    statuses.forEach(status => {
      groups[status] = [];
    });
    expenses.forEach(expense => {
      const status = expense.status_expense || 'Uncategorized';
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(expense);
    });
    for (const status in groups) {
      groups[status].sort((a, b) => (a.kanban_order || 0) - (b.kanban_order || 0));
    }
    setGroupedExpenses(groups);
  }, [expenses, statuses]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (!canEditStatus) return;
    setActiveExpense(expenses.find(e => e.id === event.active.id) || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!canEditStatus) return;
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

    setGroupedExpenses(prev => {
      const newGroups = { ...prev };
      const sourceItems = newGroups[activeContainer];
      const destItems = newGroups[overContainer];
      if (!sourceItems || !destItems) return prev;

      const activeIndex = sourceItems.findIndex(e => e.id === activeId);
      if (activeIndex === -1) return prev;

      const [movedItem] = sourceItems.splice(activeIndex, 1);
      movedItem.status_expense = overContainer;

      const overIndex = overIsItem ? destItems.findIndex(e => e.id === overId) : destItems.length;
      destItems.splice(overIndex, 0, movedItem);
      
      return newGroups;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!canEditStatus) return;
    const { active, over } = event;
    setActiveExpense(null);
    if (!over) return;

    const activeId = String(active.id);
    const activeContainer = active.data.current?.sortable.containerId as string;
    const overIsItem = !!over.data.current?.sortable;
    const overContainer = overIsItem ? over.data.current?.sortable.containerId as string : String(over.id);

    const itemsInDest = groupedExpenses[overContainer];
    const orderedIds = itemsInDest.map(e => e.id);

    const { error } = await supabase.rpc('update_expense_status_and_order', {
      p_expense_id: activeId,
      p_new_status: overContainer,
      p_ordered_expense_ids: orderedIds,
    });

    if (error) {
      toast.error("Failed to update expense.", { description: error.message });
      queryClient.invalidateQueries({ queryKey: ['expenses'] }); // Revert optimistic update
    } else {
      toast.success("Expense updated.");
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDragCancel={() => setActiveExpense(null)}>
      <div className="flex gap-4 overflow-x-auto p-4">
        {statuses.map(status => (
          <ExpenseKanbanColumn
            key={status}
            status={status}
            expenses={groupedExpenses[status] || []}
            onEditExpense={onEditExpense}
            onDeleteExpense={onDeleteExpense}
            canEditStatus={canEditStatus}
          />
        ))}
      </div>
      <DragOverlay>
        {activeExpense ? (
          <ExpenseKanbanCard expense={activeExpense} onEdit={() => {}} onDelete={() => {}} canDrag={true} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default ExpenseKanbanView;