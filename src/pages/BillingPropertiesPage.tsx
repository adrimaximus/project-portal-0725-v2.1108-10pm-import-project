import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronRight, Palette, ListPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const BillingPropertiesPage = () => {
  const navigate = useNavigate();
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
              <BreadcrumbPage>Billing Properties</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing Properties</h1>
          <p className="text-muted-foreground">
            Manage payment statuses and other billing-related fields.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card onClick={() => navigate('/settings/payment-statuses')} className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Payment Statuses
                </CardTitle>
                <CardDescription>Define and reorder the stages of your payment process.</CardDescription>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
          </Card>
          <Card onClick={() => navigate('/settings/custom-billing-fields')} className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <ListPlus className="h-4 w-4" />
                  Custom Fields
                </CardTitle>
                <CardDescription>Create and manage custom fields for billing records.</CardDescription>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
};

export default BillingPropertiesPage;