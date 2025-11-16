import { useState } from 'react';
import PortalLayout from '@/components/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, List, LayoutGrid, Calendar, MoreHorizontal, PlusCircle, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

type Expense = {
  id: string;
  project_id: string;
  project_name: string;
  project_slug: string;
  project_owner: {
    id: string;
    name: string;
    avatar_url: string;
    initials: string;
  };
  beneficiary: string;
  tf_amount: number;
  terms: string | null;
  status_expense: string;
  due_date: string | null;
  account_bank: {
    bank_name: string;
    account_number: string;
    holder_name: string;
  } | null;
  remarks: string | null;
  created_at: string;
};

const ExpensePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_expenses');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const filteredExpenses = expenses.filter(expense =>
    expense.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.beneficiary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (expense.project_owner?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const summaryStats = {
    totalAmount: expenses.reduce((acc, e) => acc + e.tf_amount, 0),
    pendingCount: expenses.filter(e => e.status_expense.toLowerCase() === 'pending').length,
    overdueCount: expenses.filter(e => e.due_date && new Date(e.due_date) < new Date()).length,
  };

  return (
    <PortalLayout
      pageHeader={
        <div className="px-4 pt-4 md:px-8 md:pt-6">
          <h1 className="text-3xl font-bold tracking-tight">Expense</h1>
          <p className="text-muted-foreground">View and manage your expense details.</p>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalAmount)}</div>
              <p className="text-xs text-muted-foreground">from {expenses.length} transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.pendingCount}</div>
              <p className="text-xs text-muted-foreground">expenses awaiting approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.overdueCount}</div>
              <p className="text-xs text-muted-foreground">expenses past their due date</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by project, beneficiary, owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-full max-w-md"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className={cn(viewMode === 'list' && 'bg-accent')} onClick={() => setViewMode('list')}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className={cn(viewMode === 'grid' && 'bg-accent')} onClick={() => setViewMode('grid')}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> New Expense
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Beneficiary</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Terms</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Bank Account</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">Loading expenses...</TableCell>
                  </TableRow>
                ) : filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">No expenses found.</TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        <Link to={`/projects/${expense.project_slug}`} className="hover:underline">{expense.project_name}</Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={expense.project_owner?.avatar_url} alt={expense.project_owner?.name} />
                            <AvatarFallback>{expense.project_owner?.initials}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{expense.project_owner?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{expense.beneficiary}</TableCell>
                      <TableCell>{formatCurrency(expense.tf_amount)}</TableCell>
                      <TableCell>{expense.terms || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(expense.status_expense) as any} className="capitalize">{expense.status_expense}</Badge>
                      </TableCell>
                      <TableCell>{expense.due_date ? format(new Date(expense.due_date), 'PP') : '-'}</TableCell>
                      <TableCell>
                        {expense.account_bank ? (
                          <div>
                            <div className="font-medium">{expense.account_bank.holder_name}</div>
                            <div className="text-sm text-muted-foreground">{expense.account_bank.bank_name} - {expense.account_bank.account_number}</div>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">{expense.remarks || '-'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default ExpensePage;