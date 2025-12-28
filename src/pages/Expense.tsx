import { useMemo, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, LayoutList, KanbanSquare, Plus, MoreHorizontal, Edit, Trash2, TrendingUp, AlertCircle, CheckCircle2, Wallet } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, subMonths, isSameMonth, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ExpenseDetailsDialog from "@/components/billing/ExpenseDetailsDialog";
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

const ExpensePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const queryClient = useQueryClient();

  const { data: userProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      return data;
    }
  });

  const canEditStatus = useMemo(() => {
    if (!userProfile) return false;
    const role = userProfile.role?.toLowerCase() || '';
    return ['master admin', 'finance', 'admin', 'admin project'].includes(role);
  }, [userProfile]);

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
      ((expense as any).purpose_payment && (expense as any).purpose_payment.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (expense.remarks && expense.remarks.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (expense.tags && expense.tags.some(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase())))
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

  // Analytics Calculations
  const analytics = useMemo(() => {
    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce((sum, e) => sum + e.tf_amount, 0);
    
    // Calculate paid amount accurately considering split payments
    const calculatePaidAmount = (e: Expense) => {
        const terms = (e as any).payment_terms || [];
        if (terms.length > 0) {
           return terms
             .filter((t: any) => t.status === 'Paid')
             .reduce((s: number, t: any) => s + (Number(t.amount) || 0), 0);
        }
        return e.status_expense === 'Paid' ? e.tf_amount : 0;
    };

    const totalPaid = expenses.reduce((sum, e) => sum + calculatePaidAmount(e), 0);
    const totalOutstanding = totalAmount - totalPaid;

    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const thisMonthExpenses = expenses.filter(e => new Date(e.created_at) >= startOfCurrentMonth);
    const totalThisMonth = thisMonthExpenses.reduce((sum, e) => sum + e.tf_amount, 0);

    // Chart Data - Last 12 Months
    const start = subMonths(now, 11);
    const months = eachMonthOfInterval({ start: startOfMonth(start), end: now });
    
    const chartData = months.map(month => {
      const monthExpenses = expenses.filter(e => isSameMonth(new Date(e.created_at), month));
      const monthlyTotal = monthExpenses.reduce((sum, e) => sum + e.tf_amount, 0);
      const monthlyPaid = monthExpenses.reduce((sum, e) => sum + calculatePaidAmount(e), 0);
      const monthlyOutstanding = monthlyTotal - monthlyPaid;

      return {
        name: format(month, 'MMM yyyy'),
        total: monthlyTotal,
        paid: monthlyPaid,
        outstanding: monthlyOutstanding,
        count: monthExpenses.length
      };
    });

    return {
      totalAmount,
      totalPaid,
      totalOutstanding,
      totalThisMonth,
      chartData
    };
  }, [expenses]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  const formatCompactCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      notation: "compact",
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-700/50';
      case 'pending': 
      case 'proposed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700/50';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-700/50';
      case 'on review': 
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-700/50';
      case 'requested': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-700/50';
      case 'approved': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 border-teal-200 dark:border-teal-700/50';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const getDerivedStatus = (expense: Expense) => {
    const paymentTerms = (expense as any).payment_terms || [];
    if (paymentTerms.length === 0) return expense.status_expense || 'Pending';
    
    const statuses = paymentTerms.map(t => t.status || 'Pending');
    
    if (statuses.some((s: string) => s === 'Rejected')) return 'Rejected';
    if (statuses.some((s: string) => s === 'On review')) return 'On review';
    if (statuses.every((s: string) => s === 'Paid')) return 'Paid';
    if (statuses.every((s: string) => s === 'Requested')) return 'Requested';
    
    return 'Pending';
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
      <div className="space-y-6 pb-20">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expense</h1>
          <p className="text-muted-foreground">
            Track and manage all project-related expenses.
          </p>
        </div>

        {/* Insight Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCompactCurrency(analytics.totalAmount)}</div>
              <p className="text-xs text-muted-foreground">
                Lifetime recorded expenses
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{formatCompactCurrency(analytics.totalOutstanding)}</div>
              <p className="text-xs text-muted-foreground">
                Pending or processing payment
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCompactCurrency(analytics.totalPaid)}</div>
              <p className="text-xs text-muted-foreground">
                Successfully disbursed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCompactCurrency(analytics.totalThisMonth)}</div>
              <p className="text-xs text-muted-foreground">
                Expenses recorded in {format(new Date(), 'MMMM')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Monthly Expense Trends</CardTitle>
            <CardDescription>Total expenses vs paid and outstanding amounts over the last 12 months.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${new Intl.NumberFormat("id-ID", { notation: "compact" }).format(value)}`} 
                  />
                  <RechartsTooltip
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm text-sm">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                              <div className="col-span-2 mb-1">
                                <span className="text-[0.70rem] uppercase text-muted-foreground font-bold">
                                  {payload[0].payload.name}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Total Recorded
                                </span>
                                <span className="font-bold text-primary">
                                  {formatCurrency(payload[0].value as number)}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Paid
                                </span>
                                <span className="font-bold text-green-600">
                                  {formatCurrency(payload[1].value as number)}
                                </span>
                              </div>
                              <div className="flex flex-col mt-1 col-span-2 border-t pt-1">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Outstanding (Overdue)
                                </span>
                                <span className="font-bold text-red-500">
                                  {formatCurrency(payload[2].value as number)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="total" 
                    name="Total Expense"
                    fill="currentColor" 
                    radius={[4, 4, 0, 0]} 
                    className="fill-primary/20"
                    maxBarSize={60}
                  />
                  <Bar 
                    dataKey="paid" 
                    name="Paid"
                    fill="currentColor" 
                    radius={[4, 4, 0, 0]} 
                    className="fill-green-500"
                    maxBarSize={60}
                  />
                  <Bar 
                    dataKey="outstanding" 
                    name="Outstanding"
                    fill="currentColor" 
                    radius={[4, 4, 0, 0]} 
                    className="fill-red-500"
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by project, beneficiary, tags..."
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
                    <TableHead>Beneficiary</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>PIC</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center">
                        No expenses found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpenses.map((expense) => {
                      const paymentTerms = (expense as any).payment_terms || [];
                      const paidAmount = paymentTerms
                        .filter((term: any) => term.status === 'Paid')
                        .reduce((sum: number, term: any) => sum + (Number(term.amount) || 0), 0);
                      const remainingAmount = expense.tf_amount - paidAmount;
                      // Use PIC if available, otherwise project owner
                      const pic = expense.pic || expense.project_owner;
                      const derivedStatus = getDerivedStatus(expense);

                      return (
                        <TableRow 
                          key={expense.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedExpense(expense)}
                        >
                          <TableCell>
                            {expense.account_bank && expense.account_bank.name ? (
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="underline decoration-dotted">
                                      {expense.beneficiary}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="flex flex-col gap-0.5 text-xs">
                                      <p className="font-semibold">{expense.account_bank.name}</p>
                                      <p className="text-muted-foreground">{expense.account_bank.bank}</p>
                                      <p className="text-muted-foreground">{expense.account_bank.account}</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              expense.beneficiary
                            )}
                          </TableCell>
                          <TableCell>
                            <Link 
                              to={`/projects/${expense.project_slug}`} 
                              className="font-medium text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {expense.project_name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {expense.tags && expense.tags.length > 0 ? (
                                expense.tags.map((tag) => (
                                  <Badge 
                                    key={tag.id} 
                                    variant="outline" 
                                    style={{ 
                                      backgroundColor: `${tag.color}15`, 
                                      color: tag.color,
                                      borderColor: `${tag.color}40` 
                                    }}
                                    className="text-[10px] px-1 py-0 h-5"
                                  >
                                    {tag.name}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Avatar className="h-8 w-8 cursor-default">
                                    <AvatarImage src={getAvatarUrl(pic?.avatar_url, pic?.id)} />
                                    <AvatarFallback style={generatePastelColor(pic?.id)}>
                                      {pic?.initials || '??'}
                                    </AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{pic?.name}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <p className="font-medium">{formatCurrency(expense.tf_amount)}</p>
                              {paidAmount > 0 && (
                                <p className="text-xs text-muted-foreground">Paid: {formatCurrency(paidAmount)}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className={cn("font-medium", remainingAmount > 0 ? "text-red-500" : "text-green-600")}>
                              {formatCurrency(remainingAmount)}
                            </p>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Badge variant="outline" className={cn("capitalize", getStatusBadgeStyle(derivedStatus))}>
                              {derivedStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[300px] text-xs">
                              <div className="line-clamp-2 text-muted-foreground">
                                <ReactMarkdown
                                  components={{
                                    p: ({node, ...props}) => <span className="mr-1" {...props} />,
                                    ul: ({node, ...props}) => <span className="mr-1" {...props} />,
                                    ol: ({node, ...props}) => <span className="mr-1" {...props} />,
                                    li: ({node, ...props}) => <span className="mr-1 after:content-['|'] last:after:content-none" {...props} />,
                                    a: ({node, ...props}) => <span className="text-primary underline" {...props} />,
                                  }}
                                >
                                  {expense.remarks || ''}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={(e) => e.stopPropagation()}
                                  onSelect={() => setEditingExpense(expense)}
                                >
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => e.stopPropagation()}
                                  onSelect={() => setExpenseToDelete(expense)} 
                                  className="text-destructive"
                                >
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
            onClickExpense={setSelectedExpense}
            canEditStatus={canEditStatus}
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
      <ExpenseDetailsDialog 
        open={!!selectedExpense} 
        onOpenChange={(open) => !open && setSelectedExpense(null)} 
        expense={selectedExpense} 
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