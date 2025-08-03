import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { dummyProjects, PaymentStatus } from "@/data/projects";

const getPaymentStatusVariant = (status: PaymentStatus) => {
  switch (status) {
    case 'Paid': return 'success';
    case 'Pending': return 'secondary';
    case 'Overdue': return 'destructive';
    case 'Draft': return 'outline';
    default: return 'default';
  }
};

const Billing = () => {
  return (
    <PortalLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Billing</h1>
        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dummyProjects.map(project => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>${project.budget?.toLocaleString()}</TableCell>
                    <TableCell>{project.dueDate}</TableCell>
                    <TableCell>
                      <Badge variant={getPaymentStatusVariant(project.paymentStatus!)}>{project.paymentStatus}</Badge>
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