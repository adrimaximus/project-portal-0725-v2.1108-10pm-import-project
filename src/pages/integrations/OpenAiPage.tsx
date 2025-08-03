import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const OpenAiIntegrationPage = () => {

  const handleConnect = () => {
    toast.success("Successfully connected to OpenAI!");
  };

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
                <Link to="/settings/integrations">Integrations</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>OpenAI</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              OpenAI Integration
            </h1>
            <p className="text-muted-foreground">
              Connect your OpenAI account to leverage AI models.
            </p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Connect to OpenAI</CardTitle>
            <CardDescription>Enter your OpenAI API key to activate the integration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input id="api-key" type="password" placeholder="sk-..." />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Disconnect</Button>
            <Button onClick={handleConnect}>Save and Connect</Button>
          </CardFooter>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default OpenAiIntegrationPage;