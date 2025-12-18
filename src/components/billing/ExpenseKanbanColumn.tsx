import { Expense } from '@/types';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import ExpenseKanbanCard from './ExpenseKanbanCard';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ExpenseKanbanColumnProps {
  id: string;
  title: string;
  expenses: Expense[];
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
  onClickExpense: (expense: Expense) => void;
  canEditStatus: boolean;
}

const ExpenseKanbanColumn = ({ 
  id, 
  title, 
  expenses, 
  onEditExpense, 
  onDeleteExpense, 
  onClickExpense,
  canEditStatus 
}: ExpenseKanbanColumnProps) => {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': 
      case 'proposed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': 
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'on review': 
      case 'reviewed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'requested': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'approved': return 'bg-teal-100 text-teal-800 border-teal-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.tf_amount), 0);
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

  return (
    <div className="flex-shrink-0 transition-all duration-300 ease-in-out h-full flex flex-col bg-muted/50 rounded-lg max-h-[700px] w-[280px] sm:w-72">
      <div className="p-4 border-b bg-background/50 backdrop-blur rounded-t-md">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className={cn("font-semibold capitalize", getStatusColor(title))}>
            {title}
          </Badge>
          <span className="text-xs text-muted-foreground font-medium">{expenses.length}</span>
        </div>
        <div className="text-sm font-bold text-muted-foreground">
          {formatCurrency(totalAmount)}
        </div>
      </div>
      
      <div ref={setNodeRef} className="flex-1 overflow-y-auto p-2">
        <SortableContext items={expenses.map(e => e.id)} strategy={verticalListSortingStrategy}>
          {expenses.map((expense) => (
            <ExpenseKanbanCard
              key={expense.id}
              expense={expense}
              onEdit={onEditExpense}
              onDelete={onDeleteExpense}
              onClick={onClickExpense}
              canDrag={canEditStatus}
            />
          ))}
        </SortableContext>
        {expenses.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
            No expenses
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseKanbanColumn;