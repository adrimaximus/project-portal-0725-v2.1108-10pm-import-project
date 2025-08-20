import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/hooks/useProjects";
import { PaymentStatus } from "@/types";
import { cn, getPaymentStatusStyles } from "@/lib/utils";
import { format, addDays, isPast } from "date-fns";
import { DollarSign, Clock, AlertTriangle, Download, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

type Invoice = {
  id: string;
  projectId: string;
  projectName: string;
  amount: number;
  dueDate: Date;
  status: PaymentStatus;
};

const Billing = () => {
  const { data: projects = [], isLoading } = useProjects();

  const invoices: Invoice[] = projects
    .map(project => {
      if (!project.payment_status || !project.budget || !project.due_date) {
        return null;
      }
      
      const dueDate = addDays(new Date(project.due_date), 30);

      let finalStatus = project.payment_status;
      if (['Unpaid', 'Pending', 'In Process'].includes(finalStatus) && isPast(dueDate)) {
        finalStatus = 'Overdue';
      }

      return {
        id: `INV-${project.id}`,
        projectId: project.slug,
        projectName: project.name,
        amount: project.budget,
        dueDate: dueDate,
        status: finalStatus as PaymentStatus,
      };
    })
    .filter((invoice): invoice is Invoice => invoice !== null)
    .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());

  const outstandingBalance = invoices
    .filter(inv => ['Due', 'Overdue', 'Unpaid', 'Pending', 'In Process'].includes(inv.status))
    .reduce((sum, inv) => sum + inv.amount, 0);

  const nextDueDate = invoices
    .filter(inv => ['Due', 'Unpaid', 'Pending', 'In Process'].includes(inv.status))
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0]?.dueDate;

  const overdueInvoicesCount = invoices.filter(inv => inv.status === 'Overdue').length;

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
          <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">
            View your invoices and manage your payment details, derived from your projects.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{'Rp ' + outstandingBalance.toLocaleString('id-ID')}</div>
              <p className="text-xs text-muted-foreground">Total amount due</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Payment Due</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {nextDueDate ? format(nextDueDate, 'MMM dd, yyyy') : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Date of next invoice payment</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overdueInvoicesCount}</div>
              <p className="text-xs text-muted-foreground">Invoices past their due date</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>
                        <Link to={`/projects/${invoice.projectId}`} className="font-medium text-primary hover:underline">
                          {invoice.projectName}
                        </Link>
                      </TableCell>
                      <TableCell>{'Rp ' + invoice.amount.toLocaleString('id-ID')}</TableCell>
                      <TableCell>{format(invoice.dueDate, 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("border-transparent", getPaymentStatusStyles(invoice.status).tw)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
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

export default Billing;