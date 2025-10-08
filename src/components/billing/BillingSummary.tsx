import { Invoice, ExtendedProject, Member } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { useMemo } from "react";
import { DollarSign, Clock, AlertTriangle, Users } from "lucide-react";

interface BillingSummaryProps {
  invoices: Invoice[];
  projects: ExtendedProject[];
}

export const BillingSummary = ({ invoices, projects }: BillingSummaryProps) => {
  const summary = useMemo(() => {
    const outstanding = invoices
      .filter(inv => inv.status !== 'Paid' && inv.status !== 'Cancelled')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const nextPaymentDue = invoices
      .filter(inv => inv.status !== 'Paid' && inv.status !== 'Cancelled' && inv.dueDate)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]?.dueDate;

    const overdueCount = invoices.filter(inv => inv.status === 'Overdue').length;

    const projectAdmins: { [id: string]: Member & { projectCount: number } } = {};
    projects.forEach(project => {
      const admins = project.assignedTo.filter(member => member.role === 'admin' || member.role === 'owner');
      admins.forEach(admin => {
        if (projectAdmins[admin.id]) {
          projectAdmins[admin.id].projectCount++;
        } else {
          projectAdmins[admin.id] = { ...admin, projectCount: 1 };
        }
      });
    });

    return {
      outstanding,
      nextPaymentDue,
      overdueCount,
      projectAdmins: Object.values(projectAdmins).sort((a, b) => b.projectCount - a.projectCount),
    };
  }, [invoices, projects]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.outstanding)}</div>
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
            {summary.nextPaymentDue ? format(new Date(summary.nextPaymentDue), 'MMM dd, yyyy') : 'N/A'}
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
          <div className="text-2xl font-bold">{summary.overdueCount}</div>
          <p className="text-xs text-muted-foreground">Invoices past their due date</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Project Admins</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {summary.projectAdmins.slice(0, 2).map(admin => (
              <div key={admin.id} className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={admin.avatar_url || undefined} />
                  <AvatarFallback>{admin.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-none">{admin.name}</p>
                  <p className="text-xs text-muted-foreground">{admin.projectCount} project{admin.projectCount > 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};