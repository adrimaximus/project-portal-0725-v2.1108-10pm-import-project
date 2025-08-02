import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dummyInvoices, Invoice } from "@/data/invoices";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DollarSign, Clock, AlertTriangle, Download } from "lucide-react";

const getStatusClass = (status: Invoice['status']) => {
  switch (status) {
    case 'Paid':
      return 'bg-green-100 text-green-800';
    case 'Due':
      return 'bg-blue-100 text-blue-800';
    case 'Overdue':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const Billing = () => {
  const outstandingBalance = dummyInvoices
    .filter(inv => inv.status === 'Due' || inv.status === 'Overdue')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const nextDueDate = dummyInvoices
    .filter(inv => inv.status === 'Due')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]?.dueDate;

  const overdueInvoices = dummyInvoices.filter(inv => inv.status === 'Overdue').length;

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">
            View your invoices and manage your payment details.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${outstandingBalance.toLocaleString()}</div>
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
                {nextDueDate ? format(new Date(nextDueDate), 'MMM dd, yyyy') : 'N/A'}
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
              <div className="text-2xl font-bold">{overdueInvoices}</div>
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
                {dummyInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>{invoice.project}</TableCell>
                    <TableCell>${invoice.amount.toLocaleString()}</TableCell>
                    <TableCell>{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("border-transparent", getStatusClass(invoice.status))}>
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default Billing;