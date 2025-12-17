import { Expense } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface ExpenseKanbanCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onClick?: (expense: Expense) => void;
  canDrag: boolean;
}

const ExpenseKanbanCard = ({ expense, onEdit, onDelete, onClick, canDrag }: ExpenseKanbanCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: expense.id,
    disabled: !canDrag 
  });
  
  const style = { transform: CSS.Transform.toString(transform), transition };

  const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

  // Determine border color based on status to match badge styles
  const getStatusColor = (status?: string) => {
    const s = status?.toLowerCase() || '';
    if (s === 'paid') return '#22c55e'; // green-500
    if (s === 'pending' || s === 'proposed') return '#eab308'; // yellow-500
    if (s === 'cancelled' || s === 'rejected') return '#ef4444'; // red-500
    if (s === 'requested') return '#a855f7'; // purple-500
    if (s === 'on review' || s === 'reviewed') return '#3b82f6'; // blue-500
    if (s === 'approved') return '#14b8a6'; // teal-500
    return '#cbd5e1'; // slate-300
  };

  const borderColor = getStatusColor(expense.status_expense);

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className={cn(
        "mb-3", 
        canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-default",
        isDragging && "opacity-30"
      )}
    >
      <Card 
        className="hover:shadow-md transition-shadow border-l-4 cursor-pointer" 
        style={{ borderLeftColor: borderColor }}
        onClick={() => onClick?.(expense)}
      >
        <CardHeader className="p-3 pb-2 flex flex-row items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold leading-none tracking-tight">{expense.beneficiary}</p>
            <p className="text-xs text-muted-foreground">{expense.project_name}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(expense)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onDelete(expense)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-lg font-bold">{formatCurrency(expense.tf_amount)}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseKanbanCard;