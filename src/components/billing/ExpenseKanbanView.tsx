import { useMemo, useState } from 'react';
import { Expense } from '@/types';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, TouchSensor, closestCorners, DragStartEvent, DragEndEvent, DragOverEvent, defaultDropAnimationSideEffects, DropAnimation } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import ExpenseKanbanColumn from './ExpenseKanbanColumn';
import ExpenseKanbanCard from './ExpenseKanbanCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface ExpenseKanbanViewProps {
  expenses: Expense[];
  statuses: string[];
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
  onClickExpense: (expense: Expense) => void;
  canEditStatus: boolean;
}

const ExpenseKanbanView = ({ 
  expenses, 
  statuses, 
  onEditExpense, 
  onDeleteExpense,
  onClickExpense,
  canEditStatus 
}: ExpenseKanbanViewProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const columns = useMemo(() => {
    return statuses.map(status => ({
      id: status,
      title: status,
      expenses: expenses
        .filter(e => (e.status_expense || 'Pending') === status)
        .sort((a, b) => (a.kanban_order || 0) - (b.kanban_order || 0))
    }));
  }, [expenses, statuses]);

  const onDragStart = (event: DragStartEvent) => {
    if (!canEditStatus) return;
    setActiveId(event.active.id as string);
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeExpense = expenses.find(e => e.id === activeId);
    if (!activeExpense) return;

    // Find destination column and index
    let newStatus = activeExpense.status_expense;
    let newIndex = (activeExpense.kanban_order || 0);

    const overColumn = columns.find(col => col.id === overId);
    const overExpense = expenses.find(e => e.id === overId);

    if (overColumn) {
      // Dropped on a column header or empty column
      newStatus = overColumn.id;
      newIndex = 0; // Move to top? Or end? Usually 0 if empty.
      
      // Calculate index if we want to append
      const expensesInColumn = expenses.filter(e => e.status_expense === newStatus);
      if (expensesInColumn.length > 0) {
         newIndex = expensesInColumn.length; 
      }
    } else if (overExpense) {
      // Dropped on another expense
      newStatus = overExpense.status_expense;
      
      const expensesInColumn = expenses
        .filter(e => e.status_expense === newStatus)
        .sort((a, b) => (a.kanban_order || 0) - (b.kanban_order || 0));
        
      const overIndex = expensesInColumn.findIndex(e => e.id === overId);
      const activeIndex = expensesInColumn.findIndex(e => e.id === activeId);
      
      if (activeIndex !== -1) {
        // Same column reorder
        newIndex = arrayMove(expensesInColumn, activeIndex, overIndex).findIndex(e => e.id === activeId);
      } else {
        // Different column
        newIndex = overIndex;
      }
    }

    if (newStatus !== activeExpense.status_expense) {
      // Optimistic update
      const updatedExpenses = expenses.map(e => {
        if (e.id === activeId) {
          return { ...e, status_expense: newStatus };
        }
        return e;
      });
      // We rely on RQ invalidation mostly, but immediate UI feedback is nice.
      // However, we are not setting state here because it comes from props.
      
      try {
        // Get ordered IDs for the new status column
        const targetColumnExpenses = expenses
          .filter(e => e.status_expense === newStatus && e.id !== activeId)
          .sort((a, b) => (a.kanban_order || 0) - (b.kanban_order || 0));
          
        // Insert active item at new index
        // If it was dropped on a column, we appended or prepended
        if (overColumn) {
             targetColumnExpenses.push(activeExpense);
        } else if (overExpense) {
             const overIndex = targetColumnExpenses.findIndex(e => e.id === overId);
             const isBelow = active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
             const modifier = isBelow ? 1 : 0;
             // Logic is complex without arrayMove context, relying on backend simply receiving ordered IDs is safer if we get the full list correctly.
             // Simplification: just put it at the end if column, or calculate properly.
             // For now, let's just trigger the status update.
        }
        
        // Actually, let's construct the new order for the column
        let orderedIds: string[] = [];
        const sameColumn = activeExpense.status_expense === newStatus;
        
        if (sameColumn) {
             const expensesInColumn = expenses
                .filter(e => e.status_expense === newStatus)
                .sort((a, b) => (a.kanban_order || 0) - (b.kanban_order || 0));
             const oldIndex = expensesInColumn.findIndex(e => e.id === activeId);
             const newIdx = expensesInColumn.findIndex(e => e.id === overId);
             const reordered = arrayMove(expensesInColumn, oldIndex, newIdx);
             orderedIds = reordered.map(e => e.id);
        } else {
             const targetExpenses = expenses
                .filter(e => e.status_expense === newStatus)
                .sort((a, b) => (a.kanban_order || 0) - (b.kanban_order || 0));
             
             if (overColumn) {
                 // Append
                 targetExpenses.push(activeExpense);
                 orderedIds = targetExpenses.map(e => e.id);
             } else {
                 const overIndex = targetExpenses.findIndex(e => e.id === overId);
                 // Check if dropping above or below is tricky without detailed collision data
                 // default to insert before
                 targetExpenses.splice(overIndex, 0, activeExpense);
                 orderedIds = targetExpenses.map(e => e.id);
             }
        }

        const { error } = await supabase.rpc('update_expense_status_and_order', {
          p_expense_id: activeId,
          p_new_status: newStatus,
          p_ordered_expense_ids: orderedIds
        });

        if (error) throw error;
        toast.success(`Expense moved to ${newStatus}`);
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
      } catch (error: any) {
        toast.error('Failed to update expense', { description: error.message });
      }
    }
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  const activeExpense = useMemo(() => expenses.find(e => e.id === activeId), [expenses, activeId]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {columns.map(col => (
          <ExpenseKanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            expenses={col.expenses}
            onEditExpense={onEditExpense}
            onDeleteExpense={onDeleteExpense}
            onClickExpense={onClickExpense}
            canEditStatus={canEditStatus}
          />
        ))}
      </div>
      {createPortal(
        <DragOverlay dropAnimation={dropAnimation}>
          {activeExpense && (
            <ExpenseKanbanCard
              expense={activeExpense}
              onEdit={() => {}}
              onDelete={() => {}}
              canDrag={true}
            />
          )}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
};

export default ExpenseKanbanView;