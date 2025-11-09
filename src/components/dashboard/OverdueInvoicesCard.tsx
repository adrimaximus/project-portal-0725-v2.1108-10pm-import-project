import { AlertTriangle } from "lucide-react";
import StatCard from "./StatCard";
import { useInvoices } from "@/hooks/useInvoices";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const OverdueInvoicesCard = () => {
  const { invoices, isLoading } = useInvoices();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue Bills</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-1/2 mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  const overdueInvoices = invoices.filter(inv => {
    if (inv.payment_status === 'Paid' || inv.payment_status === 'Cancelled') {
      return false;
    }
    if (inv.payment_due_date) {
      return new Date(inv.payment_due_date) < new Date();
    }
    return false;
  });

  const totalOverdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  const tooltipContent = (
    <div className="p-1">
      <p className="font-bold mb-2 text-sm">Overdue Invoices ({overdueInvoices.length})</p>
      {overdueInvoices.length > 0 ? (
        <ul className="space-y-1.5">
          {overdueInvoices.slice(0, 5).map(invoice => (
            <li key={invoice.id} className="text-xs flex justify-between items-center gap-4">
              <Link to={`/projects/${invoice.project_slug}`} className="truncate hover:underline max-w-[150px]">
                {invoice.project_name}
              </Link>
              <span className="font-mono whitespace-nowrap text-muted-foreground">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(invoice.amount)}
              </span>
            </li>
          ))}
          {overdueInvoices.length > 5 && (
            <li className="text-xs text-muted-foreground mt-2">
              ...and {overdueInvoices.length - 5} more
            </li>
          )}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No overdue invoices.</p>
      )}
    </div>
  );

  return (
    <StatCard
      title="Overdue Bills"
      value={`Rp ${new Intl.NumberFormat('id-ID').format(totalOverdueAmount)}`}
      icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
      description={`${overdueInvoices.length} invoices past due date`}
      tooltipContent={overdueInvoices.length > 0 ? tooltipContent : undefined}
    />
  );
};

export default OverdueInvoicesCard;