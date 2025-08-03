import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitBranch } from "lucide-react";
import React from "react";

const IntegrationItem = ({ name, description, icon, noBg = false }: { name: string, description: string, icon: React.ReactNode, noBg?: boolean }) => (
    <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-4">
            <div className={`p-2 rounded-md ${noBg ? "" : "bg-muted"}`}>
                {icon}
            </div>
            <div>
                <h3 className="font-semibold">{name}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
        <Button variant="outline">Connect</Button>
    </div>
)

const IntegrationsPage = () => {
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
              <BreadcrumbPage>Integrations</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Integrations
            </h1>
            <p className="text-muted-foreground">
              Connect and manage your third-party application integrations.
            </p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Available Integrations</CardTitle>
            <CardDescription>Connect your tools to streamline your workflow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <IntegrationItem name="GitHub" description="Sync your repositories and issues." icon={<GitBranch className="h-5 w-5" />} />
            <IntegrationItem name="Slack" description="Get notifications in your Slack channels." icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.83 12.83a2 2 0 0 0-2.83 0 2 2 0 0 0 0 2.83 2 2 0 0 0 2.83 0 2 2 0 0 0 0-2.83z"></path><path d="M18.36 18.36a2 2 0 0 0 0-2.83 2 2 0 0 0-2.83 0 2 2 0 0 0 0 2.83 2 2 0 0 0 2.83 0z"></path><path d="M11.17 12.83a2 2 0 0 0 0-2.83 2 2 0 0 0-2.83 0 2 2 0 0 0 0 2.83 2 2 0 0 0 2.83 0z"></path><path d="M5.64 5.64a2 2 0 0 0 0 2.83 2 2 0 0 0 2.83 0 2 2 0 0 0 0-2.83 2 2 0 0 0-2.83 0z"></path><path d="M12.83 11.17a2 2 0 0 0-2.83 0 2 2 0 0 0 0 2.83 2 2 0 0 0 2.83 0 2 2 0 0 0 0-2.83z"></path><path d="M18.36 5.64a2 2 0 0 0 0 2.83 2 2 0 0 0 2.83 0 2 2 0 0 0 0-2.83 2 2 0 0 0-2.83 0z"></path><path d="M11.17 11.17a2 2 0 0 0 0 2.83 2 2 0 0 0 2.83 0 2 2 0 0 0 0-2.83 2 2 0 0 0-2.83 0z"></path><path d="M5.64 18.36a2 2 0 0 0 2.83 0 2 2 0 0 0 0-2.83 2 2 0 0 0-2.83 0 2 2 0 0 0 0 2.83z"></path></svg>} />
            <IntegrationItem 
                name="Google Drive" 
                description="Access your files from Google Drive." 
                noBg={true}
                icon={
                    <img src="/google-drive-icon.png" alt="Google Drive icon" className="h-5 w-5" />
                } 
            />
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default IntegrationsPage;