import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitBranch, Mail } from "lucide-react";
import React from "react";

const IntegrationItem = ({ name, description, icon, path, noBg = false, disabled = false }: { name: string, description: string, icon: React.ReactNode, path: string, noBg?: boolean, disabled?: boolean }) => (
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
        <Button asChild variant="outline" disabled={disabled}>
            <Link to={path}>Connect</Link>
        </Button>
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
            <IntegrationItem 
                name="Google Drive" 
                description="Access your files from Google Drive." 
                noBg={true}
                icon={
                    <img src="/google-drive-icon.png" alt="Google Drive icon" className="h-5 w-5" />
                }
                path="/settings/integrations/google-drive"
            />
            <IntegrationItem 
                name="Google Calendar" 
                description="Sync your projects with Google Calendar." 
                noBg={true}
                icon={
                    <img src="https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/FileGoogle%20Calendar%20icon%20(2020).svg%20-%20Wikimedia%20Commons.png" alt="Google Calendar icon" className="h-5 w-5" />
                }
                path="/settings/integrations/google-calendar"
            />
            <IntegrationItem 
                name="OpenAI" 
                description="Leverage AI models for your projects." 
                path="/settings/integrations/openai"
                icon={
                    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor">
                        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-2.9832 6.0015 6.0015 0 0 0-2.4832-2.4832 5.9847 5.9847 0 0 0-2.9832-.5157 5.9935 5.9935 0 0 0-2.9542.5446l.2944.1697.004.0023a6.0015 6.0015 0 0 1 2.66 2.4542 5.98 5.98 0 0 1 .5156 2.9832 5.9935 5.9935 0 0 1-.5446 2.9542l-.1697.2944-.0023.004a6.0015 6.0015 0 0 0 2.4542 2.66 5.98 5.98 0 0 0 2.9832.5156 5.9935 5.9935 0 0 0 2.9542-.5446l-.2944-.1697-.004-.0023a6.0015 6.0015 0 0 1-2.66-2.4542 5.98 5.98 0 0 1-.5156-2.9832M1.7181 14.1789a5.9847 5.9847 0 0 0 .5157 2.9832 6.0015 6.0015 0 0 0 2.4832 2.4832 5.9847 5.9847 0 0 0 2.9832.5157 5.9935 5.9935 0 0 0 2.9542-.5446l-.2944-.1697-.004-.0023a6.0015 6.0015 0 0 1-2.66-2.4542 5.98 5.98 0 0 1-.5156-2.9832 5.9935 5.9935 0 0 1 .5446-2.9542l.1697-.2944.0023-.004a6.0015 6.0015 0 0 0-2.4542-2.66 5.98 5.98 0 0 0-2.9832-.5156 5.9935 5.9935 0 0 0-2.9542.5446l.2944.1697.004.0023a6.0015 6.0015 0 0 1 2.66 2.4542 5.98 5.98 0 0 1 .5156 2.9832m4.8261-8.3343a5.9847 5.9847 0 0 0-2.9832.5157 5.9935 5.9935 0 0 0-2.9542.5446l.2944.1697.004.0023a6.0015 6.0015 0 0 1 2.66 2.4542 5.98 5.98 0 0 1 .5156 2.9832 5.9935 5.9935 0 0 1-.5446 2.9542l-.1697.2944-.0023.004a6.0015 6.0015 0 0 0 2.4542 2.66 5.98 5.98 0 0 0 2.9832.5156 5.9935 5.9935 0 0 0 2.9542-.5446l-.2944-.1697-.004-.0023a6.0015 6.0015 0 0 1-2.66-2.4542 5.98 5.98 0 0 1-.5156-2.9832 5.9935 5.9935 0 0 1 .5446-2.9542l.1697-.2944.0023-.004a6.0015 6.0015 0 0 0-2.4542-2.66m8.3343 4.8261a5.9847 5.9847 0 0 0 .5157-2.9832 6.0015 6.0015 0 0 0-2.4832-2.4832 5.9847 5.9847 0 0 0-2.9832-.5157 5.9935 5.9935 0 0 0-2.9542.5446l.2944.1697.004.0023a6.0015 6.0015 0 0 1 2.66 2.4542 5.98 5.98 0 0 1 .5156 2.9832 5.9935 5.9935 0 0 1-.5446 2.9542l-.1697.2944-.0023-.004a6.0015 6.0015 0 0 0 2.4542 2.66 5.98 5.98 0 0 0 2.9832.5156 5.9935 5.9935 0 0 0 2.9542-.5446l-.2944-.1697-.004-.0023a6.0015 6.0015 0 0 1-2.66-2.4542 5.98 5.98 0 0 1-.5156-2.9832" />
                    </svg>
                } 
            />
            <IntegrationItem 
                name="WBIZTOOL" 
                description="Connect your WBIZTOOL account for business automation." 
                path="/settings/integrations/wbiztool"
                icon={<GitBranch className="h-5 w-5" />}
            />
            <IntegrationItem 
                name="Emailit" 
                description="Connect your Emailit account for transactional emails." 
                path="/settings/integrations/emailit"
                icon={<Mail className="h-5 w-5" />}
            />
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default IntegrationsPage;