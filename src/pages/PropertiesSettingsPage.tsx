import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, User, Building, Briefcase, CreditCard } from "lucide-react";
import TagsPropertiesCard from "@/components/settings/TagsPropertiesCard";

const PropertiesSettingsPage = () => {
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
              <BreadcrumbPage>Custom Properties</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Custom Properties</h1>
          <p className="text-muted-foreground">
            Manage custom data fields for different parts of your workspace.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card onClick={() => navigate('/settings/people-properties')} className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Contact Properties
              </CardTitle>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Customize the data fields for your contacts.
              </p>
            </CardContent>
          </Card>
          <Card onClick={() => navigate('/settings/company-properties')} className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Building className="h-4 w-4" />
                Company Properties
              </CardTitle>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Customize the data fields for your companies.
              </p>
            </CardContent>
          </Card>
          <Card onClick={() => navigate('/settings/project-properties')} className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Project Properties
              </CardTitle>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage statuses, categories, and other project fields.
              </p>
            </CardContent>
          </Card>
          <Card onClick={() => navigate('/settings/billing-properties')} className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Billing Properties
              </CardTitle>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage payment statuses and other billing-related fields.
              </p>
            </CardContent>
          </Card>
          <TagsPropertiesCard />
        </div>
      </div>
    </PortalLayout>
  );
};

export default PropertiesSettingsPage;