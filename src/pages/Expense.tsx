import { useMemo, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, LayoutList, KanbanSquare, Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl, generatePastelColor, cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Expense } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AddExpenseDialog from "@/components/billing/AddExpenseDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditExpenseDialog from "@/components/billing/EditExpenseDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import ExpenseKanbanView from "@/components/billing/ExpenseKanbanView";

const ExpensePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_expenses');
      if (error) throw error;
      return data;
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Expense deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: (error: any) => {
      toast.error("Failed to delete expense.", { description: error.message });
    }
  });

  const handleDeleteExpense = () => {
    if (expenseToDelete) {
      deleteExpenseMutation.mutate(expenseToDelete.id);
      setExpenseToDelete(null);
    }
  };

  const filteredExpenses = useMemo(() => {
    if (!searchTerm) return expenses;
    return expenses.filter(expense =>
      expense.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.beneficiary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.status_expense.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.remarks && expense.remarks.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [expenses, searchTerm]);

  const { expensesByStatus, orderedStatuses } = useMemo(() => {
    const statusOrder = ['Proposed', 'Reviewed', 'Approved', 'Paid', 'Rejected'];
    const grouped = filteredExpenses.reduce((acc, expense) => {
      const status = expense.status_expense || 'Uncategorized';
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(expense);
      return acc;
    }, {} as Record<string, Expense[]>);

    const existingStatuses = Object.keys(grouped);
    const ordered = statusOrder.filter(s => existingStatuses.includes(s));
    const otherStatuses = existingStatuses.filter(s => !statusOrder.includes(s));
    
    return { expensesByStatus: grouped, orderedStatuses: [...ordered, ...otherStatuses] };
  }, [filteredExpenses]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

  const getStatusBadgeStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-700/50';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700/50';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-700/50';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expense</h1>
          <p className="text-muted-foreground">
            Track and manage all project-related expenses.
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by project, beneficiary, etc..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView('table')}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'kanban' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setView('kanban')}
            >
              <KanbanSquare className="h-4 w-4" />
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Expense
            </Button>
          </div>
        </div>

        {view === 'table' ? (
          <Card>
            <CardHeader>
              <CardTitle>All Expenses</CardTitle>
              <CardDescription>A list of all recorded expenses across your projects.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Beneficiary</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="whitespace-nowrap">Payment Plan</TableHead>
                    <TableHead>Bank Account</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        No expenses found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpenses.map((expense) => {
                      const paymentTerms = (expense as any).payment_terms || [];
                      const paidAmount = paymentTerms
                        .filter((term: any) => term.status === 'Paid')
                        .reduce((sum: number, term: any) => sum + (term.amount || 0), 0);
                      const outstandingAmount = expense.tf_amount - paidAmount;

                      return (
                        <TableRow key={expense.id}>
                          <TableCell>
                            <Link to={`/projects/${expense.project_slug}`} className="font-medium text-primary hover:underline">
                              {expense.project_name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={getAvatarUrl(expense.project_owner.avatar_url, expense.project_owner.id)} />
                                <AvatarFallback style={generatePastelColor(expense.project_owner.id)}>
                                  {expense.project_owner.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{expense.project_owner.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{expense.beneficiary}</TableCell>
                          <TableCell>
                            <div>
                              <p>{formatCurrency(expense.tf_amount)}</p>
                              {outstandingAmount > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  Outstanding: {formatCurrency(outstandingAmount)}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {paymentTerms.length > 0 ? (
                              <div className="flex flex-col">
                                {paymentTerms.map((term: any, index: number) => {
                                  const isMultiTerm = paymentTerms.length > 1;
                                  return (
                                    <div key={index} className={cn("text-xs", index > 0 && "border-t pt-2 mt-2")}>
                                      {isMultiTerm ? (
                                        <>
                                          <div className="flex items-center gap-2 font-medium">
                                            <span>Term {index + 1}</span>
                                            <span className="text-muted-foreground">|</span>
                                            <span>{formatCurrency(term.amount || 0)}</span>
                                          </div>
                                          {term.request_date && (
                                            <p className="text-muted-foreground text-xs mt-0.5">
                                              {term.request_type || 'Due'}: {format(new Date(term.request_date), "dd MMM yyyy")}
                                            </p>
                                          )}
                                          {term.release_date && (
                                            <p className="text-muted-foreground text-xs">
                                              scheduled: {format(new Date(term.release_date), "dd MMM yyyy")}
                                            </p>
                                          )}
                                          <div className="mt-1">
                                            <Badge variant="outline" className={cn("border-transparent text-xs whitespace-nowrap", getStatusBadgeStyle(term.status || 'Pending'))}>
                                              {term.status || 'Pending'}
                                            </Badge>
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <div className="flex items-center justify-between gap-2">
                                            <span>{formatCurrency(term.amount || 0)}</span>
                                            <Badge variant="outline" className={cn("border-transparent text-xs whitespace-nowrap", getStatusBadgeStyle(term.status || 'Pending'))}>
                                              {term.status || 'Pending'}
                                            </Badge>
                                          </div>
                                          {term.request_date && (
                                            <p className="text-muted-foreground text-xs mt-0.5">
                                              {term.request_type || 'Due'}: {format(new Date(term.request_date), "dd MMM yyyy")}
                                            </p>
                                          )}
                                          {term.release_date && (
                                            <p className="text-muted-foreground text-xs">
                                              scheduled: {format(new Date(term.release_date), "dd MMM yyyy")}
                                            </p>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {expense.account_bank && expense.account_bank.name ? (
                              <div>
                                <p className="font-medium">{expense.account_bank.name}</p>
                                <p className="text-sm text-muted-foreground">{expense.account_bank.bank} - {expense.account_bank.account}</p>
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>{expense.remarks}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => setEditingExpense(expense)}>
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setExpenseToDelete(expense)} className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <ExpenseKanbanView
            expenses={filteredExpenses}
            statuses={orderedStatuses}
            onEditExpense={setEditingExpense}
            onDeleteExpense={setExpenseToDelete}
          />
        )}
      </div>
      <AddExpenseDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      <EditExpenseDialog
        open={!!editingExpense}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setEditingExpense(null);
          }
        }}
        expense={editingExpense}
      />
      <AlertDialog open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the expense record for {expenseToDelete?.beneficiary}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
};

export default ExpensePage;