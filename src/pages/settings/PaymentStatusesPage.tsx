import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PaymentStatusesPage = () => {
  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/settings">Settings</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/settings/properties">Custom Properties</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Payment Statuses</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Statuses</h1>
          <p className="text-muted-foreground">
            Customize the payment statuses for projects.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Statuses</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Here you can manage your payment statuses.</p>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default PaymentStatusesPage;