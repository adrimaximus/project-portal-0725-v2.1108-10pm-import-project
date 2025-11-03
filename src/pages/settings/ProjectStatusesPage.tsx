import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ProjectStatusesPage = () => {
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
              <BreadcrumbPage>Project Statuses</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project Statuses</h1>
          <p className="text-muted-foreground">
            Manage the different statuses for your projects.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Statuses</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Here you can manage your project statuses.</p>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default ProjectStatusesPage;