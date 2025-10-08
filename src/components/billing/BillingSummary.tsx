import { Invoice } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BillingSummaryProps {
  invoices: Invoice[];
}

export const BillingSummary = ({ invoices }: BillingSummaryProps) => {
  const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0);
  const totalUnpaid = totalBilled - totalPaid;
  const overdue = invoices.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Rp {totalBilled.toLocaleString('id-ID')}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Rp {totalPaid.toLocaleString('id-ID')}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Unpaid</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Rp {totalUnpaid.toLocaleString('id-ID')}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">Rp {overdue.toLocaleString('id-ID')}</div>
        </CardContent>
      </Card>
    </div>
  );
};