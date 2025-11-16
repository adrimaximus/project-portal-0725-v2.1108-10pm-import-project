import { useMemo, useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
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
import { getAvatarUrl, generatePastelColor, getInitials, cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Expense } from "@/types";

const ExpensePage = () => {
  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_expenses');
      if (error) throw error;
      return data;
    },
  });

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
                  <TableHead>Due Date</TableHead>
                  <TableHead>Bank Account</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      No expenses found.
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
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
                      <TableCell>{expense.due_date ? format(new Date(expense.due_date), 'MMM dd, yyyy') : '-'}</TableCell>
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
      </div>
    </PortalLayout>
  );
};

export default ExpensePage;