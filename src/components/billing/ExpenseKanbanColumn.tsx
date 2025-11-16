import { Expense } from '@/types';
import ExpenseKanbanCard from './ExpenseKanbanCard';
import { Badge } from '@/components/ui/badge';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMemo } from 'react';

interface ExpenseKanbanColumnProps {
  status: string;
  expenses: Expense[];
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
}

const ExpenseKanbanColumn = ({ status, expenses, onEditExpense, onDeleteExpense }: ExpenseKanbanColumnProps) => {
  const { setNodeRef } = useDroppable({ id: status });
  const expenseIds = useMemo(() => expenses.map(e => e.id), [expenses]);

  return (
    <div ref={setNodeRef} className="w-72 flex-shrink-0">
      <div className="flex flex-col bg-muted/50 rounded-lg">
        <div className="font-semibold p-3 text-base flex items-center justify-between">
          <h3 className="flex items-center gap-2 truncate">
            <span className="truncate capitalize">{status}</span>
            <Badge variant="secondary">{expenses.length}</Badge>
          </h3>
        </div>
        <div className="min-h-[6rem] p-2 pt-0 overflow-y-auto">
          <SortableContext id={status} items={expenseIds} strategy={verticalListSortingStrategy}>
            {expenses.map(expense => (
              <ExpenseKanbanCard key={expense.id} expense={expense} onEdit={onEditExpense} onDelete={onDeleteExpense} />
            ))}
          </SortableContext>
          {expenses.length === 0 && (
            <div className="flex items-center justify-center h-20 m-2 border-2 border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground">Drop here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseKanbanColumn;