import { useMemo, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, LayoutList, KanbanSquare, Plus } from "lucide-react";
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

const ExpensePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_expenses');
      if (error) throw error;
      return data;
    },
  });

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
    const statusOrder = ['Pending', 'Paid', 'Rejected'];
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
    switch (status.toLowerCase()) {
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
                    <TableHead>Terms</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bank Account</TableHead>
                    <TableHead>Remarks</TableHead>
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
                    filteredExpenses.map((expense) => (
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
                        <TableCell>{formatCurrency(expense.tf_amount)}</TableCell>
                        <TableCell>{expense.terms}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("border-transparent", getStatusBadgeStyle(expense.status_expense))}>{expense.status_expense}</Badge>
                        </TableCell>
                        <TableCell>
                          {expense.account_bank ? (
                            <div>
                              <p className="font-medium">{expense.account_bank.name}</p>
                              <p className="text-sm text-muted-foreground">{expense.account_bank.bank} - {expense.account_bank.account}</p>
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{expense.remarks}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {orderedStatuses.map(status => (
              <div key={status} className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-1">
                  <h2 className="font-semibold text-lg capitalize">{status}</h2>
                  <Badge variant="secondary" className="rounded-full">
                    {expensesByStatus[status]?.length || 0}
                  </Badge>
                </div>
                <div className="flex flex-col gap-4 rounded-lg">
                  {(expensesByStatus[status] || []).map(expense => (
                    <Card key={expense.id}>
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base font-semibold">{expense.beneficiary}</CardTitle>
                            <CardDescription>
                              <Link to={`/projects/${expense.project_slug}`} className="hover:underline text-primary text-sm">
                                {expense.project_name}
                              </Link>
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className={cn("border-transparent text-xs", getStatusBadgeStyle(expense.status_expense))}>{expense.status_expense}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="font-bold text-xl">{formatCurrency(expense.tf_amount)}</p>
                        <div className="flex items-center gap-2 pt-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={getAvatarUrl(expense.project_owner.avatar_url, expense.project_owner.id)} />
                            <AvatarFallback style={generatePastelColor(expense.project_owner.id)} className="text-xs">
                              {expense.project_owner.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{expense.project_owner.name}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(!expensesByStatus[status] || expensesByStatus[status].length === 0) && (
                    <div className="text-center text-muted-foreground py-8 px-4 border-2 border-dashed rounded-lg">
                      No expenses in this category.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <AddExpenseDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </PortalLayout>
  );
};

export default ExpensePage;