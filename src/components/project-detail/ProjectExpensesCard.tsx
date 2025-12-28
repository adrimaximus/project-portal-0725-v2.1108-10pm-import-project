import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Receipt, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useProjectExpenses } from "@/hooks/useProjectExpenses";
import { Badge } from "@/components/ui/badge";
import AddExpenseDialog from "@/components/billing/AddExpenseDialog";
import ExpenseDetailsDialog from "@/components/billing/ExpenseDetailsDialog";
import { Expense, Project } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProjectExpensesCardProps {
  project: Project;
}

const ProjectExpensesCard = ({ project }: ProjectExpensesCardProps) => {
  const { data: expenses, isLoading } = useProjectExpenses(project.id);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const { user, hasPermission } = useAuth();

  const canCreateExpense = hasPermission('module:expense');
  
  // Logic to determine if user should see the card at all
  // If loading, show skeleton.
  // If loaded and empty list:
  //    - If user is just a member (not admin/owner) -> Hide (return null)
  //    - If user is admin/owner -> Show (so they can add)
  
  const isProjectAdmin = project.assignedTo.some(m => m.id === user?.id && m.role === 'admin');
  const isProjectOwner = project.created_by.id === user?.id;
  const isGlobalAdmin = user?.role === 'master admin' || user?.role === 'admin';
  
  const hasPrivilegedAccess = isProjectAdmin || isProjectOwner || isGlobalAdmin;

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  // If no expenses and user shouldn't see empty state (regular member who didn't create any)
  if ((!expenses || expenses.length === 0) && !hasPrivilegedAccess && !canCreateExpense) {
    return null;
  }

  const totalAmount = expenses?.reduce((sum, e) => sum + e.tf_amount, 0) || 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid': return <CheckCircle2 className="h-3 w-3 text-green-600" />;
      case 'Rejected': return <AlertCircle className="h-3 w-3 text-red-600" />;
      default: return <Clock className="h-3 w-3 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-700 border-green-200';
      case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Expenses
          </CardTitle>
          {canCreateExpense && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="text-2xl font-bold">{formatIDR(totalAmount)}</div>
          
          <ScrollArea className="h-[200px] -mr-4 pr-4">
            <div className="space-y-3">
              {expenses?.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No expenses recorded.</p>
              ) : (
                expenses?.map((expense) => (
                  <div 
                    key={expense.id} 
                    className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted/50 cursor-pointer border border-transparent hover:border-border transition-colors"
                    onClick={() => setSelectedExpense(expense)}
                  >
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <span className="font-medium truncate">{expense.beneficiary}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] px-1 py-0 h-4 gap-1 ${getStatusColor(expense.status_expense)}`}>
                          {getStatusIcon(expense.status_expense)}
                          {expense.status_expense}
                        </Badge>
                      </div>
                    </div>
                    <div className="font-medium tabular-nums ml-2">
                      {formatIDR(expense.tf_amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <AddExpenseDialog 
        open={isAddOpen} 
        onOpenChange={setIsAddOpen}
        defaultProjectId={project.id}
      />
      
      <ExpenseDetailsDialog 
        open={!!selectedExpense}
        onOpenChange={(open) => !open && setSelectedExpense(null)}
        expense={selectedExpense}
      />
    </>
  );
};

export default ProjectExpensesCard;